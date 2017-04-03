#!/bin/bash

# ---------------------------------------------------------------------------
# main.sh - This script will be use to provide our platform deployment main.sh architecture

# Copyright 2015, Stanislas KOFFI ASSOUTOVI <team@djanta.net>

# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License at <http://www.gnu.org/licenses/> for
# more details.

# Usage: ./run.sh [-h|--help] [-i|--install [-u|--uninstall] [-c|--task-config]

# Revision history:
# ---------------------------------------------------------------------------

SYMLINKS=`readlink -f $0`
SCRIPT_DIR=`dirname $SYMLINKS`

CWD=$(pwd)
SOURCE_DIR="$SCRIPT_DIR"
USER_HOME="$(eval echo ~)"
TOOLS_DIR=$(cd "$SOURCE_DIR/../"; pwd)
PROJECT_ROOT_DIR=$(cd "$SOURCE_DIR/../"; pwd)
PARENT_DIR=$(cd "$SOURCE_DIR/.."; pwd)
LIB_DIR=$(cd "$PARENT_DIR/lib"; pwd)

PREFIX=${2:-"optional_prefix_"}
YAML_INPUT_FILE=${1:-"./tag.yml"}

eval "$(${LIB_DIR}/lib/yaml.sh ${YAML_INPUT_FILE} ${PREFIX})"

# Obtain parse_yml variables as follows:
echo "${optional_prefix_development_adapter}"

#echo "${optional_prefix_development_apt[@]}"
#echo ${#optional_prefix_development_apt[@]} #Print the variable lenght

# get length of an array
tLen=${#optional_prefix_development_roles[@]}

# use for loop read all nameservers
for (( i=0; i < ${tLen}; i++ )); do
  echo ${optional_prefix_development_roles[$i]}
done
