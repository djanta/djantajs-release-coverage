#!/bin/sh

SYMLINKS=`readlink -f $0`
SCRIPT_DIR=`dirname $SYMLINKS`

CWD=$(pwd)
SOURCE_DIR="$SCRIPT_DIR"
USER_HOME="$(eval echo ~)"
TOOLS_DIR=$(cd "$SOURCE_DIR/../"; pwd)
PROJECT_ROOT_DIR=$(cd "$SOURCE_DIR/../"; pwd)
PARENT_DIR=$(cd "$SOURCE_DIR/.."; pwd)
LIB_DIR=$(cd "$PARENT_DIR/lib"; pwd)

## include parse_yaml function
source $LIB_DIR/parse_yaml.sh

echo "LIB_DIR = $LIB_DIR"

## read yaml file
#eval $(parse_yaml zconfig.yml "config_")

## access yaml content
#echo $config_development_database
