#!/bin/bash

shopt -s extglob

#################################################################################
# THIS SCRIPT HAS BEEN MODIFIED & ADAPTED FROM THE THE FOLLOWING GIST:
#   --> https://gist.github.com/bclinkinbeard/1331790
#################################################################################

GIT_BIN=`which git`

#BRANCH_HEAD=$($git rev-parse --abbrev-ref HEAD)

# current Git branch
BRANCH_HEAD=$(git symbolic-ref HEAD | sed -e 's,.*/\(.*\),\1,')

BRANCH_NAME=${BRANCH_HEAD:-'master'}
DEV_BRANCH=develop

# v1.0.0, v1.5.2, etc.
VERSION_LABEL=v${1:-"1.0.0"}

# establish branch and tag name variables
MASTER_BRANCH=${BRANCH_NAME}#master
RELEASE_BRANCH=release-$VERSION_LABEL

# create the release branch from the -develop branch
git checkout -b $RELEASE_BRANCH $DEV_BRANCH

# file in which to update version number
VERSION_FILE="version.txt"

#-[ -f "$VERSION_FILE" ] eval "$(cat "${VERSION_FILE}" < "")" && echo "$VERSION_FILE"

# find version number assignment ("= v1.5.5" for example) and replace it with newly specified version number
sed -i.backup -E "s/\= v[0-9.]+/\= $VERSION_LABEL/" $VERSION_FILE $VERSION_FILE

# remove backup file created by sed command
rm $VERSION_FILE.backup

# commit version number increment
git commit -am "Incrementing version number to $VERSION_LABEL"

# merge release branch with the new version number into master
git checkout $MASTER_BRANCH

# now merge with no fail
git merge --no-ff $RELEASE_BRANCH

# create tag for new version from -master
git tag $VERSION_LABEL

# merge release branch with the new version number back into develop
git checkout $DEV_BRANCH
git merge --no-ff $RELEASE_BRANCH

# remove release branch
git branch -d $RELEASE_BRANCH
