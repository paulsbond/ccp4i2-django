@echo off
setlocal EnableDelayedExpansion

:: Store the original environment variables in a temporary file
set temp_file=%temp%\original_env.txt
set json_output={

:: Capture the original environment variables
for /f "tokens=*" %%A in ('set') do (
    set var=%%A
    set var_name=!var:*=!
    set var_value=!var:*!=!
    echo !var_name!=!var_value!>> %temp_file%
)

:: Run the provided command (the user must pass a command to run)
:: Suppress output of the command
%* >nul 2>&1

:: Capture the new environment variables after execution
for /f "tokens=*" %%A in ('set') do (
    set var=%%A
    set var_name=!var:*=!
    set var_value=!var:*!=!
    
    :: Check if the variable was in the original set
    findstr /b /c:"!var_name!=" %temp_file% >nul
    if errorlevel 1 (
        :: This is a newly defined variable, add it to the JSON output
        set json_output=!json_output!"!var_name!":"!var_value!", 
    ) else (
        :: If the variable value has changed, add it to the JSON output
        for /f "tokens=1,* delims==" %%B in ('findstr /b /c:"!var_name!=" %temp_file%') do (
            if "%%C" neq "!var_value!" (
                set json_output=!json_output!"!var_name!":"!var_value!", 
            )
        )
    )
)

:: Remove trailing comma if necessary
set json_output=!json_output:~0,-1!

:: Close the JSON object
set json_output=!json_output!}

:: Output the JSON
echo !json_output!

:: Clean up
del %temp_file%

endlocal
