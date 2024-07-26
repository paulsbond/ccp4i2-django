# ccp4ui

## Development

First, make sure that the environment `CCP4UI_DEV` is set to `true`,
e.g. by putting the following into ~/.bashrc

```bash
export CCP4UI_DEV=true
```

This turns Django DEBUG mode on
and allows cross origin requests from `localhost:3000`
(the default address for the Next.js development server).

Next, clone the project from GitHub,
install the dependencies, make an inital database migration
and start the Django development server for the REST API.
Note that **Python 3.9+ is required**.

```console
user:~$ git clone https://github.com/paulsbond/ccp4ui
user:~$ cd ccp4ui/server
user:~/ccp4ui/server$ python3 -m pip install --user -e .
user:~/ccp4ui/server$ python3 manage.py migrate
user:~/ccp4ui/server$ python3 manage.py runserver
```

For easy viewing of the REST API and Next.js logs separately,
start the Next.js development server in a new terminal.

```console
user:~/ccp4ui/server$ cd ../client
user:~/ccp4ui/client$ npm ci
user:~/ccp4ui/client$ npm run dev
```

Open a browser at http://localhost:3000 to view the app.
The Django server and the Next.js server
will both automatically restart
when any changes are made to files.

If making any changes to the database models,
run the following commands to update the database:

```console
user:~/ccp4ui$ python3.9 manage.py makemigrations
user:~/ccp4ui$ python3.9 manage.py migrate
```
