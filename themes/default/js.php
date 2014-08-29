<?php

namespace kcfinder;

chdir(dirname(__FILE__).'/../..');
require "core/autoload.php";
$theme = basename(dirname(__FILE__));
$min = new minifier("js");
$min->minify("cache/theme_$theme.js",dirname(__FILE__));
