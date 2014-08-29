<?php
/** This file is part of KCFinder project
 *
 *      @desc Path management class
 *   @version 3.12
 *    @author Constantin MARINA <dinu.marina@exteon.ro>
 * @copyright 2006-2014 www.exteon.ro
 *   @license http://opensource.org/licenses/LGPL-3.0 LGPLv3
 *      @link http://www.exteon.ro
 */

	class pathSpec {
		/**
		 * @var string
		 */
		protected $key;
		
		/**
		 * @var string
		 */
		protected $dir;
		
		/**
		 * @var string
		 */
		protected $url;
		
		/**
		 * @var string
		 */
		protected $canonicalUrl;
		
		/**
		 * @var string
		 */
		protected $rel;
		
		/**
		 * @var string
		 */
		protected $name;
		
		function __construct($name,$key,$dir,$url,$canonicalUrl,$rel=''){
		    $this->name=$name;
			$this->key=$key;
			$this->dir=$dir;
			$this->url=$url;
			$this->rel=$rel;
			$this->canonicalUrl=$canonicalUrl;
		}
		
		function getUrl(){
			return $this->url.(strlen($this->url)&&strlen($this->rel)?'/':'').$this->rel;
		}

		function getCanonicalUrl(){
			return $this->canonicalUrl.(strlen($this->url)&&strlen($this->rel)?'/':'').$this->rel;
		}
		
		function getPath(){
			return $this->dir.(strlen($this->dir)&&strlen($this->rel)?'/':'').$this->rel;
		}
		
		function getNS(){
			return $this->key.(strlen($this->key)&&strlen($this->rel)?'/':'').$this->rel;
		}
		
		function getRel(){
		    return $this->rel;
		}
		
		function getName(){
		    return $this->name;
		}
		
		/**
		 * @param string $path
		 * @return pathSpec
		 */
		function descend($path){
		    $path=str_replace(DIRECTORY_SEPARATOR,'/',$path);
			$pathFrags=explode('/',$path);
			foreach($pathFrags as $key=>$value){
				if(
					$value==='' ||
					$value==='.'
				){
					unset($pathFrags[$key]);
					continue;
				}
				if(
					$value==='..' ||
					$value===DIRECTORY_SEPARATOR
				){
					throw new Exception('Cannot descend to upper folder');
				}
			}
			$path=implode('/',$pathFrags);
			return new \pathSpec($this->name, $this->key, $this->dir, $this->url, $this->canonicalUrl, ($this->rel?$this->rel.'/':'').$path);
		}
		
		function exists(){
			return file_exists($this->getPath());
		}
		
		function isFile(){
			return is_file($this->getPath());
		}
		
		function isDir(){
			return is_dir($this->getPath());
		}
		
		function isAncestorNS($NSPath){
			$ns=$this->getNS();
			$nsLen=strlen($ns);
			$NSPathLen=strlen($NSPath);
			if(
				substr($NSPath,0,$nsLen)==$ns &&
				(
					$NSPathLen==$nsLen ||
					$NSPath[$nsLen]=='/'
				)
			){
				return true;
			}
			return false;
		}
		
		function getKey(){
			return $this->key;
		}
		
		function __toString(){
			return $this->getPath();
		}
		
		function ascend($levels=1){
			$levels=intval($levels);
			if($levels<1){
				throw new Exception('Cannot understand levels');
			}
			if(!strlen($this->rel)){
			    return null;
			}
			$frags=explode('/',$this->rel);
			if(count($frags)<$levels){
				return null;
			}
			$frags=array_slice($frags,0,count($frags)-$levels);
			return new \pathSpec($this->name,$this->key,$this->dir,$this->url,$this->canonicalUrl,implode('/',$frags));
		}
		
		function prepareDir($mode=0755){
		    if($this->isDir()){
		        return true;
		    }
		    if($this->exists()){
		        return false;
		    }
		    $parent=$this->ascend(1);
		    if(
		        $parent &&
		        !$parent->prepareDir($mode)
            ){
		        return false;
		    }
		    return $this->mkDir($mode);
		}
		
		function mkDir($mode=0755){
		    return @mkdir($this->getPath(),$mode);
		}
		
		function isReadable(){
		    return is_readable($this->getPath());
		}
	}