# ccp4ui

Exploration of new technologies for a desktop CCP4i2 (and maybe CCP4i) replacement.

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
user:~$ cd ccp4ui
user:~/ccp4ui$ python3.9 -m pip install --user -e .
user:~/ccp4ui$ python3.9 manage.py migrate
user:~/ccp4ui$ python3.9 manage.py runserver
```

For easy viewing of the REST API and Next.js logs separately,
start the Next.js development server in a new terminal.

```console
user:~/ccp4ui$ cd ccp4ui/client
user:~/ccp4ui/ccp4ui/client$ npm ci
user:~/ccp4ui/ccp4ui/client$ npm run dev
```

Open a browser at http://localhost:3000 to view the app.
The Django server and the Next.js server
will both automatically restart
when any changes are made to files.

If making any changes to the models,
run the following commands to update the database:

```console
user:~/ccp4ui$ python3.9 manage.py makemigrations
user:~/ccp4ui$ python3.9 manage.py migrate
```

Once all developers have the required migrations
they can be consolidated by deleting the migration files
and re-running the above commands.

## Building

```console
user:~/ccp4ui$ cd ccp4ui/client
user:~/ccp4ui/ccp4ui/client$ npm run build
user:~/ccp4ui/ccp4ui/client$ cd ../..
user:~/ccp4ui$ python3.9 manage.py collectstatic --no-input
user:~/ccp4ui$ python3.9 -m pip install --user .
```

These commands build the Next.js production site
and collect the files needed to `ccp4ui/ccp4ui/static`.
The `pip install` command installs the application,
along with these static files,
and creates an `ccp4ui` executable in your path
that will start the application.

Running the application requires electron to be in your path.
It can be installed globally on your system using npm:

```console
user:~$ npm install --global electron
```
