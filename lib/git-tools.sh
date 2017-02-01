#!/bin/bash

# ---------------------------------------------------------------------------
# git-tools.sh - This script will be use to provide our platform deployment git-tools architecture
#
# Copyright 2015, Stanislas KOFFI ASSOUTOVI <team@djanta.net>
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License at <http://www.gnu.org/licenses/> for
# more details.
#
# Usage: ./git-tools.sh [-h|--help] [-i|--install [-u|--uninstall] [-c|--task-config]
# Revision history:
# ---------------------------------------------------------------------------

branchName=$($git rev-parse --abbrev-ref HEAD)

# current Git branch
branch=$(git symbolic-ref HEAD | sed -e 's,.*/\(.*\),\1,')

BRANCH_NAME=${branchName:-'master'}

SHA1=$(git rev-list $branch | tail -n $1 | head -n 1)

#git checkout $SHA1

number_of_commits=$(git rev-list HEAD --count)
git_release_version=$(git describe --tags --always --abbrev=0)
