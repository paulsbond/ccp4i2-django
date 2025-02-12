from ccp4i2.core.CCP4TaskManager import CTaskManager


def get_task_tree():
    taskManager = CTaskManager()
    result = {"tree": taskManager.taskTree(), "lookup": taskManager.taskLookup}
    return result
