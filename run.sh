#!/bin/bash

# ---------------------------------------------------------------------------
# run.sh - This script will be use to provide our platform deployment main.sh architecture

# Copyright 2015, Stanislas KOFFI ASSOUTOVI <team@djanta.io>

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

argv0=$(echo "$0" | sed -e 's,\\,/,g')
basedir=$(dirname "$(readlink "$0" || echo "$argv0")")

case "$(uname -s)" in
  Linux) basedir=$(dirname "$(readlink -f "$0" || echo "$argv0")");;
  *CYGWIN*) basedir=`cygpath -w "$basedir"`;;
esac

SCRIPT_DIR=`dirname ${basedir}`
LIB_DIR=$(cd "$SCRIPT_DIR/lib"; pwd)

PREFIX=${2:-"X"}
YAML_INPUT_FILE=${1:-"tag.yml"}

conf=$(cat ${YAML_INPUT_FILE})

eval "$(${LIB_DIR}/yaml.sh ${YAML_INPUT_FILE} ${PREFIX})"

# Obtain parse_yml variables as follows:
echo "${X_public_adapter}"

#echo "${optional_prefix_public_apt[@]}"
#echo ${#optional_prefix_public_apt[@]} #Print the variable lenght

# get length of an array
tLen=${#X_public_public_projects_roles[@]}

# use for loop read all nameservers
for (( i=0; i < ${tLen}; i++ )); do
  echo ${X_public_public_projects_roles[$i]}
done

#echo "${conf}"
