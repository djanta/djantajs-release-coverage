# ---------------------------------------------------------------------------
# color.sh - This script will be use to provide our platform deployment color.sh architecture
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
# ---------------------------------------------------------------------------

PROGNAME=`basename $0`
GREP="grep"

# OS specific support (must be 'true' or 'false').
cygwin=false;
darwin=false;
linux=false;
case "`uname`" in
    CYGWIN*)
        cygwin=true
        ;;
    Darwin*)
        darwin=true
        ;;
    Linux)
        linux=true
        ;;
esac

# Increase the maximum file descriptors if we can
if [ "$cygwin" = "false" ]; then
    MAX_FD_LIMIT=`ulimit -H -n`
    if [ "$?" -eq 0 ]; then
        # Darwin does not allow RLIMIT_INFINITY on file soft limit
        if [ "$darwin" = "true" -a "$MAX_FD_LIMIT" = "unlimited" ]; then
            MAX_FD_LIMIT=`/usr/sbin/sysctl -n kern.maxfilesperproc`
        fi

	if [ "$MAX_FD" = "maximum" -o "$MAX_FD" = "max" ]; then
	    # use the system max
	    MAX_FD="$MAX_FD_LIMIT"
	fi

	ulimit -n $MAX_FD
	if [ "$?" -ne 0 ]; then
	    warn "Could not set maximum file descriptor limit: $MAX_FD"
	fi
    else
	warn "Could not query system maximum file descriptor limit: $MAX_FD_LIMIT"
    fi
fi

#
# Helper to complain.
#
warn() {
    echo "${PROGNAME}: $*"
}

#
# Helper to puke.
#
die() {
    warn $*
    exit 1
}

function clean_up() { # Perform pre-exit housekeeping
  return
}

function error_exit() {
  echo -e "${PROGNAME}: ${1:-"Unknown Error"}" >&2
    clean_up
  exit 1
}

function root_prompt() {
  echo -e "${PROGNAME}: ${1:-"Unknown Error"}"

  # Check for root UID
  #if [[ $(id -u) != 0 ]]; then
  #  error_exit "You must be the superuser to run this script."
  #fi
}

function prepare__() {
    echo "Preparing the global environment ..."
}

function help_content(){
    printf "${CYAN}${@}${NORMAL}\n" 1>&2
}

function help_header(){
    action=${1}
    shift
    printf "   ${RED}${THIS} ${action}${NORMAL} ${@}\n" 1>&2
}

function graceful_exit() {
  clean_up
  exit
}

function signal_exit() { # Handle trapped signals
  case $1 in
    INT)
      error_exit "Program interrupted by user" ;;
    TERM)
      echo -e "\n$PROGNAME: Program terminated" >&2
      graceful_exit ;;
    *)
      error_exit "$PROGNAME: Terminating on unknown signal" ;;
  esac
}

function to_lower() {
  local str="$@"
  local output

  output=$(tr '[A-Z]' '[a-z]'<<<"${str}")
  echo $output
}

function arg_value() {
  arg_name="${2}"

  local value_=""

  local ARGV="$@"
  local ARGV_LENGTH=${#ARGV}

  for i in ${@:3:$ARGV_LENGTH}; do
    PARAM=`echo $i | awk -F= '{print $1}'`
    VALUE=`echo $i | awk -F= '{print $2}'`

    case ${PARAM} in
    "$arg_name")
      value_=${i}
      eval "$1=\"${VALUE}\""  # Assign new value.
    ;;
    esac
  done
}

##########################################################################################################
#					                   LOG ANY OF CALLED OPERATION					 	                 #
##########################################################################################################
function logOpt() {
  local fname
  local fvalues
  local args
  fname="$1"

  shift
  for args in "$@"; do
    fvalues="$fvalues ""'$( echo "$args" | sed -e 's#\s\+# #g' )'"
  done
  [ -z "$QUIET" ] && echo -e "${DEBUG_BOLD}$fname${DEBUG_NORMAL}(""$( echo "$fvalues" | sed -e 's#^ ##' -e "s#\s\+''\$##g" )"")...${RESET}"
}
