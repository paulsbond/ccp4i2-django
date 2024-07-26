from argparse import ArgumentParser
from . import __version__
from .logging import configure_logging
from .server import Server
from .window import open_window


def main():
    parser = ArgumentParser()
    parser.add_argument("-v", "--version", action="version", version=__version__)
    parser.parse_args()

    configure_logging()
    server = Server()
    url = server.start()
    open_window(url)
    server.stop()


if __name__ == "__main__":
    main()
