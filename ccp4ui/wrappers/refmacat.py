from pathlib import Path
from shutil import rmtree, which
from subprocess import Popen, PIPE
from textwrap import dedent
from xml.etree import ElementTree as ET
from ..utils import puid


class RefmacatResult:
    def __init__(self, directory, hklout, xmlout, xyzout):
        xml = ET.parse(xmlout).getroot()
        r_works = list(xml.iter("r_factor"))
        r_frees = list(xml.iter("r_free"))
        fscs = list(xml.iter("fscAver"))

        self.directory = directory
        self.hklout = hklout
        self.xmlout = xmlout
        self.xyzout = xyzout
        self.r_work = float(r_works[-1].text)
        self.r_free = float(r_frees[-1].text)
        self.fsc = float(fscs[-1].text)
        self.initial_r_work = float(r_works[0].text)
        self.initial_r_free = float(r_frees[0].text)
        self.initial_fsc = float(fscs[0].text)
        self.data_completeness = float(xml.find("Overall_stats/data_completeness").text)
        self.resolution_low = float(xml.find("Overall_stats/resolution_low").text)
        self.resolution_high = float(xml.find("Overall_stats/resolution_high").text)

    def delete_files(self):
        rmtree(self.directory)


def refmacat(hklin, xyzin, directory="."):
    executable = which("refmacat")
    if executable is None:
        raise FileNotFoundError("Executable 'refmacat' not found")

    hklin = Path(hklin).resolve()
    xyzin = Path(xyzin).resolve()
    for path in (hklin, xyzin):
        if not path.exists:
            raise FileNotFoundError(f"File '{path}' not found.")

    directory = Path(directory).resolve() / f"refmacat_{puid()}"
    hklout = directory / "hklout.mtz"
    xmlout = directory / "xmlout.xml"
    xyzout = directory / "xyzout.cif"
    stdout = directory / "stdout.txt"
    stderr = directory / "stderr.txt"

    args = [executable]
    args += ["HKLIN", str(hklin)]
    args += ["XYZIN", str(xyzin)]
    args += ["HKLOUT", str(hklout)]
    args += ["XMLOUT", str(xmlout)]
    args += ["XYZOUT", str(xyzout)]

    directory.mkdir()
    with open(stdout, "w", encoding="utf-8") as out_stream:
        with open(stderr, "w", encoding="utf-8") as err_stream:
            with Popen(
                args,
                stdin=PIPE,
                stdout=out_stream,
                stderr=err_stream,
                encoding="utf-8",
                cwd=directory,
            ) as process:
                process.stdin.write("NCYCLES 5\n")
                process.stdin.write("WEIGHT AUTO\n")
                process.stdin.close()
                process.wait()

    for path in (hklout, xmlout, xyzout):
        if not path.exists():
            message = dedent(
                f"""
                The following file does not exist:
                {path}
                This indicates that something went wrong.
                Please check the log files for details:
                {stdout}
                {stderr}"""
            )
            raise FileNotFoundError(message)

    return RefmacatResult(directory, hklout, xmlout, xyzout)
