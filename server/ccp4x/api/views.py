from rest_framework.decorators import api_view
from django.http import JsonResponse
from ..lib.job_utils.get_task_tree import get_task_tree


@api_view(["GET", "POST"])
def task_tree(request):
    # Not clear to me this should be a view exposed through the project api
    task_tree = get_task_tree()
    return JsonResponse({"status": "Success", "task_tree": task_tree})
