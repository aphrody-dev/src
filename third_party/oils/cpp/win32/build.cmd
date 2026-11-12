@echo off
rem cpp/win32/build.cmd: native Windows build of oils-for-unix (OSH/YSH)
rem with clang-cl + lld-link.  No MSYS / MinGW / Cygwin / WSL.
rem
rem Usage:  cpp\win32\build.cmd TARBALL_DIR [OUT_DIR]
rem   TARBALL_DIR  extracted oils-for-unix-X.Y.Z release tarball (for _gen/)
rem   OUT_DIR      default: _build\win32 in this repo
rem
rem Env: WINSDK (default 10.0.26100.0), CLANG_CL (default clang-cl)

setlocal enabledelayedexpansion
if "%~1"=="" (
  echo usage: %~nx0 TARBALL_DIR [OUT_DIR]
  exit /b 2
)
set "T=%~f1"
set "R=%~dp0..\.."
for %%I in ("%R%") do set "R=%%~fI"
set "O=%~2"
if "%O%"=="" set "O=%R%\_build\win32"
if not defined WINSDK set "WINSDK=10.0.26100.0"
if not defined CLANG_CL set "CLANG_CL=clang-cl"

if not exist "%T%\_gen\bin\oils_for_unix.mycpp.cc" (
  echo error: %T% is not an oils-for-unix release tarball
  exit /b 1
)
if not exist "%O%\obj" mkdir "%O%\obj"
if not exist "%O%\tools" mkdir "%O%\tools"
for %%D in (frontend core display data_lang) do (
  if not exist "%O%\gen\_gen\%%D" mkdir "%O%\gen\_gen\%%D"
)

set "FL=-winsdkversion%WINSDK% -nologo -std:c++17 -EHs -GR -O2 -Gy -Gw"
set "FL=%FL% -DOPTIMIZED -DMARK_SWEEP -D_CRT_SECURE_NO_WARNINGS -D_CRT_NONSTDC_NO_WARNINGS"
set "FL=%FL% -Wno-invalid-offsetof -Wno-deprecated-declarations -Wno-microsoft-cast"
set "FL=%FL% -Wno-writable-strings -Wno-return-type -Wno-reinterpret-base-class"
set "FL=%FL% -I%O%\gen -I%R%\cpp\win32\include -I%R% -I%T% -FIcpp/win32/posix_compat.h"

rem 1. ASDL headers from the tarball predate OILS_EMPTY_BASES (MSVC ABI fix)
%CLANG_CL% -winsdkversion%WINSDK% -nologo -O2 -EHsc "%R%\cpp\win32\tools\asdl_empty_bases.cc" -Fe"%O%\tools\asdl_empty_bases.exe" -Fo"%O%\tools\\" || exit /b 1
for %%H in (frontend\syntax.asdl.h core\value.asdl.h display\pretty.asdl.h) do (
  "%O%\tools\asdl_empty_bases.exe" "%T%\_gen\%%H" "%O%\gen\_gen\%%H" || exit /b 1
)
rem    and a few Windows path fixes to the translated shell (see *.lpatch)
%CLANG_CL% -winsdkversion%WINSDK% -nologo -O2 -EHsc "%R%\cpp\win32\tools\line_patch.cc" -Fe"%O%\tools\line_patch.exe" -Fo"%O%\tools\\" || exit /b 1
if not exist "%O%\gen\_gen\bin" mkdir "%O%\gen\_gen\bin"
"%O%\tools\line_patch.exe" "%T%\_gen\bin\oils_for_unix.mycpp.cc" "%O%\gen\_gen\bin\oils_for_unix.mycpp.cc" "%R%\cpp\win32\oils_for_unix.lpatch" || exit /b 1

rem 2. manifest (UTF-8 active code page, long paths)
llvm-rc -nologo -no-preprocess -fo "%O%\obj\oils.res" "%R%\cpp\win32\oils.rc" || exit /b 1

rem 3. compile
pushd "%R%"
for %%F in (
  mycpp\bump_leak_heap mycpp\gc_builtins mycpp\gc_iolib mycpp\gc_mops
  mycpp\gc_mylib mycpp\gc_str mycpp\hash mycpp\mark_sweep_heap
  cpp\core cpp\data_lang cpp\frontend_flag_spec cpp\frontend_match
  cpp\frontend_pyreadline cpp\libc cpp\osh cpp\osh_tdop cpp\pgen2 cpp\pylib
  cpp\stdlib cpp\win32\compat cpp\win32\fanos_win cpp\win32\main_win
) do (
  set "N=%%F"
  set "N=!N:\=_!"
  echo   CXX %%F.cc
  %CLANG_CL% %FL% -c %%F.cc -Fo"%O%\obj\!N!.obj" || (popd & exit /b 1)
)
popd
pushd "%T%"
for %%F in (
  _gen\bin\text_files _gen\core\runtime.asdl _gen\core\value.asdl
  _gen\cpp\build_stamp _gen\data_lang\nil8.asdl _gen\display\pretty.asdl
  _gen\frontend\arg_types _gen\frontend\consts _gen\frontend\help_meta
  _gen\frontend\id_kind.asdl _gen\frontend\signal _gen\frontend\syntax.asdl
  _gen\osh\arith_parse _gen\ysh\grammar_tables
) do (
  set "N=%%F"
  set "N=!N:\=_!"
  set "N=!N:.=_!"
  echo   CXX %%F.cc
  %CLANG_CL% %FL% -c %%F.cc -Fo"%O%\obj\!N!.obj" || (popd & exit /b 1)
)
echo   CXX cpp\win32\oils_win.cc (includes _gen\bin\oils_for_unix.mycpp.cc)
%CLANG_CL% %FL% -c "%R%\cpp\win32\oils_win.cc" -Fo"%O%\obj\oils_win.obj" || (popd & exit /b 1)
popd

rem 4. link
echo   LINK %O%\oils-for-unix.exe
%CLANG_CL% -fuse-ld=lld -winsdkversion%WINSDK% -nologo "%O%\obj\*.obj" "%O%\obj\oils.res" -Fe"%O%\oils-for-unix.exe" -link -opt:ref -opt:icf advapi32.lib kernel32.lib shell32.lib || exit /b 1
copy /y "%O%\oils-for-unix.exe" "%O%\osh.exe" >nul
copy /y "%O%\oils-for-unix.exe" "%O%\ysh.exe" >nul
echo OK: %O%\osh.exe
endlocal
