/** This file is part of KCFinder project
  *
  *      @desc Folder related functionality
  *   @package KCFinder
  *   @version 3.12
  *    @author Pavel Tzonkov <sunhater@sunhater.com>
  * @copyright 2010-2014 KCFinder Project
  *   @license http://opensource.org/licenses/GPL-3.0 GPLv3
  *   @license http://opensource.org/licenses/LGPL-3.0 LGPLv3
  *      @link http://kcfinder.sunhater.com
  */

_.initFolders = function() {
    $('#folders').scroll(function() {
        _.menu.hide();
    }).disableTextSelect();
    $('div.folder > a').unbind().click(function() {
        _.menu.hide();
        return false;
    });
    $('div.folder > a > span.brace').unbind().click(function() {
        if ($(this).hasClass('opened') || $(this).hasClass('closed'))
            _.expandDir($(this).parent());
    });
    $('div.folder > a > span.folder').unbind().click(function() {
        _.changeDir($(this).parent());
    }).rightClick(function(el, e) {
        _.menuDir($(el).parent(), e);
    });
    if ($.mobile)
        $('div.folder > a > span.folder').on('taphold', function() {
            _.menuDir($(this).parent(), {
                pageX: $(this).offset().left + 1,
                pageY: $(this).offset().top + $(this).outerHeight()
            });
        });

};

_.setTreeData = function(nodes, path, url, canonicalUrl) {
    if (!path)
        path = "";
    else if (path.length && (path.substr(path.length - 1, 1) != '/'))
        path += "/";
    for(var i = 0; i < nodes.length; i++){
    	var node = nodes[i],
    		nodePath = path + node.name, 
        	selector = '#folders a[href="kcdir:/' + $.$.escapeDirs(nodePath) + '"]',
        	nodeUrl = node.url ? node.url : url + '/' + node.name,
        	nodeCanonicalUrl = node.canonicalUrl ? node.canonicalUrl : canonicalUrl + '/' + node.name;
        $(selector).data({
            name: node.name,
            path: nodePath,
            readable: node.readable,
            writable: node.writable,
            removable: node.removable,
            hasDirs: node.hasDirs,
            url: nodeUrl,
            canonicalUrl: nodeCanonicalUrl
        });
        $(selector + ' span.folder').addClass(node.current ? 'current' : 'regular');
        if(node.dirs && node.dirs.length){
            $(selector + ' span.brace').addClass('opened');
        	_.setTreeData(node.dirs, nodePath, nodeUrl, nodeCanonicalUrl);
        } else if (node.hasDirs)
            $(selector + ' span.brace').addClass('closed');
    }
};

_.buildTree = function(nodes, path) {
    if (!path)
        path = "";
    else if (path.length && (path.substr(path.length - 1, 1) != '/'))
        path += "/";
    var html='';
    for(var i = 0; i < nodes.length; i++){
    	var node = nodes[i];
    	var nodePath = path + node.name; 
    	html += '<div class="folder"><a href="kcdir:/' + $.$.escapeDirs(path + node.name) + '"><span class="brace">&nbsp;</span><span class="folder">' + $.$.htmlData(node.displayName?node.displayName:node.name) + '</span></a>';
    	if(node.dirs){
            html += '<div class="folders">';
    		html += _.buildTree(node.dirs, nodePath);
            html += '</div>';
    	}
        html += '</div>';
    }
    return html;
};

_.expandDir = function(dir) {
    var path = dir.data('path');
    if (dir.children('.brace').hasClass('opened')) {
        dir.parent().children('.folders').hide(500, function() {
            if (path == _.dir.substr(0, path.length))
                _.changeDir(dir);
            _.fixScrollRadius();
        });
        dir.children('.brace').removeClass('opened').addClass('closed');
    } else {
        if (dir.parent().children('.folders').get(0)) {
            dir.parent().children('.folders').show(500, function() {
                _.fixScrollRadius();
            });
            dir.children('.brace').removeClass('closed').addClass('opened');
        } else if (!$('#loadingDirs').get(0)) {
            dir.parent().append('<div id="loadingDirs">' + _.label("Loading folders...") + '</div>');
            $('#loadingDirs').hide().show(200, function() {
                $.ajax({
                    type: "post",
                    dataType: "json",
                    url: _.getURL("expand"),
                    data: {dir: path},
                    async: false,
                    success: function(data) {
                        $('#loadingDirs').hide(200, function() {
                            $('#loadingDirs').detach();
                        });
                        if (_.check4errors(data))
                            return;

                        var html = "";
                        $.each(data.dirs, function(i, cdir) {
                            html += '<div class="folder"><a href="kcdir:/' + $.$.escapeDirs(path + '/' + cdir.name) + '"><span class="brace">&nbsp;</span><span class="folder">' + $.$.htmlData(cdir.name) + '</span></a></div>';
                        });
                        if (html.length) {
                            dir.parent().append('<div class="folders">' + html + '</div>');
                            var folders = $(dir.parent().children('.folders').first());
                            folders.hide();
                            $(folders).show(500, function() {
                                _.fixScrollRadius();
                            });
                            _.setTreeData(data.dirs, path, dir.data('url'), dir.data('canonicalUrl'));
                        }
                        if (data.dirs.length)
                            dir.children('.brace').removeClass('closed').addClass('opened');
                        else
                            dir.children('.brace').removeClass('opened closed');
                        _.initFolders();
                        _.initDropUpload();
                        _.fixScrollRadius();
                    },
                    error: function() {
                        $('#loadingDirs').detach();
                        _.alert(_.label("Unknown error."));
                        _.fixScrollRadius();
                    }
                });
                _.fixScrollRadius();
            });
        }
    }
};

_.changeDir = function(dir) {
    if (dir.children('span.folder').hasClass('regular')) {
        $('div.folder > a > span.folder').removeClass('current regular').addClass('regular');
        dir.children('span.folder').removeClass('regular').addClass('current');
        $('#files').html(_.label("Loading files..."));
        $.ajax({
            type: "post",
            dataType: "json",
            url: _.getURL("chDir"),
            data: {dir: dir.data('path')},
            async: false,
            success: function(data) {
                if (_.check4errors(data))
                    return;
                _.files = data.files;
                _.orderFiles();
                _.dir = dir.data('path');
                _.dirUrl = dir.data('url');
                _.dirCanonicalUrl = dir.data('canonicalUrl');
                _.dirWritable = data.dirWritable;
                _.setTitle("KCFinder: /" + _.dir);
                _.statusDir();
                _.initDropUpload();
            },
            error: function() {
                $('#files').html(_.label("Unknown error."));
            }
        });
    }
};

_.statusDir = function() {
    var i = 0, size = 0;
    for (; i < _.files.length; i++)
        size += _.files[i].size;
    size = _.humanSize(size);
    $('#fileinfo').html(_.files.length + " " + _.label("files") + " (" + size + ")");
};

_.refreshDir = function(dir) {
    var path = dir.data('path');
    if (dir.children('.brace').hasClass('opened') || dir.children('.brace').hasClass('closed'))
        dir.children('.brace').removeClass('opened').addClass('closed');
    dir.parent().children('.folders').first().detach();
    if (path == _.dir.substr(0, path.length))
        _.changeDir(dir);
    _.expandDir(dir);
    return true;
};
