<?php

namespace kcfinder;

chdir(dirname(__FILE__).'/../..');
require "core/autoload.php";
$theme = basename(dirname(__FILE__));
$min = new minifier("css");
$min->minify("cache/theme_$theme.css",dirname(__FILE__));
