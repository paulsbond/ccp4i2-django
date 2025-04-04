@echo off
setlocal EnableDelayedExpansion

:: Capture initial environment variables
for /f "tokens=1,* delims==" %%A in ('set') do (
    set "env_%%A=%%B"
)

:: Run your command here (example: set a new env variable)
:: Example: set NEW_VAR=example_value

%* >nul 2>&1

:: Now, capture the environment variables again after execution
set "json_output={"
for /f "tokens=1,* delims==" %%A in ('set') do (
    set "var_name=%%A"
    set "var_value=%%B"
    :: Check if this environment variable is new or changed
    if not defined env_%%A (
        :: This is a new variable
        set "json_output=!json_output!\"%%A\":\"%%B\","
    ) else (
        if "!env_%%A!" neq "%%B" (
            :: This is a modified variable
            set "json_output=!json_output!\"%%A\":\"%%B\","
        )
        else (
            ::echo "Unchanged variable %%A"
        )
    )
)

:: Remove the trailing comma and close the JSON object
if "!json_output:~-1!"=="," set "json_output=!json_output:~0,-1!"
set "json_output=!json_output!}"

:: Output the JSON result
echo !json_output!

endlocal

