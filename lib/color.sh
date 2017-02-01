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

ERROR_BOLD="\e[1;31m"
ERROR_NORMAL="\e[0;31m"
DEBUG_BOLD="\e[1;35m"
DEBUG_NORMAL="\e[0;35m"
RESET="\e[00m"

RED="\033[31;01m"
CYAN="\033[36;01m"
YELLOW="\033[33;01m"
NORMAL="\033[00m"

if [[ -n "$COLORS" ]] && [[ ! "$COLORS" =~ ^(always|yes|true|1)$ ]]; then
  unset ERROR_BOLD
  unset ERROR_NORMAL
  unset DEBUG_BOLD
  unset DEBUG_NORMAL
  unset RESET

  unset RED="\\e[0;31m"
  unset CYAN="\\e[0;36m"
  unset YELLOW="\\e[0;33m"
  unset NORMAL="\\e[0;0m"
fi

function cecho() {
  while [ "$1" ]; do
    case "$1" in
      -normal)        color="$NORMAL" ;;
      -black)         color="\033[30;01m" ;;
      -red)           color="$RED" ;;
      -green)         color="\033[32;01m" ;;
      -yellow)        color="$YELLOW" ;;
      -blue)          color="\033[34;01m" ;;
      -magenta)       color="\033[35;01m" ;;
      -cyan)          color="$CYAN" ;;
      -white)         color="\033[37;01m" ;;
      -n)             one_line=1;   shift ; continue ;;
      *)              echo -n "$1"; shift ; continue ;;
    esac
    shift
      echo -en "$color"
      echo -en "$1"
      echo -en "\033[00m"
      shift
  done
  if [ ! $one_line ]; then
    echo
  fi
}
