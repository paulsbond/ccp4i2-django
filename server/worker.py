#!/usr/bin/env python3
"""
Standalone worker script to process jobs from Azure Service Bus queue.
This runs independently of Django and monitors the queue for new jobs.
"""
import os
import json
import time
import logging
from azure.servicebus import ServiceBusClient
from azure.identity import DefaultAzureCredential

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def process_job(job_data):
    """
    Process a job from the queue.
    Add your specific job processing logic here.
    """
    job_uuid = job_data.get("uuid", "unknown")
    action = job_data.get("action", "unknown")

    logger.info(f"Processing job: {job_id}, action: {action}")

    try:
        # Add your job processing logic here
        if action == "run_job":
            # Example: run CCP4 analysis
            result = run_ccp4_analysis(job_data)
            logger.info(f"CCP4 analysis completed for job {job_uuid}")

        else:
            logger.warning(f"Unknown action type: {action}")
            raise ValueError(f"Unsupported action: {action}")

        # Update job status in database if needed
        # update_job_status(job_id, 'completed', result)

        return True

    except Exception as e:
        logger.error(f"Error processing job {job_id}: {e}")
        raise


def run_ccp4_analysis(parameters):
    """Placeholder for CCP4 analysis logic"""

    logger.info(f"Running CCP4 analysis with parameters: {parameters}")
    # Add your CCP4 processing code here
    time.sleep(10)  # Simulate processing time
    return {"status": "completed", "result": "analysis_result"}


def update_job_status(job_id, status, result=None):
    """Update job status in database (optional)"""
    # If you want to track job status, implement this
    # This would require Django ORM or direct database access
    pass


def main():
    """Main worker loop"""
    # Get configuration from environment
    queue_name = os.getenv("SERVICE_BUS_QUEUE_NAME", "ccp4i2-bicep-jobs")
    connection_string = os.getenv("SERVICE_BUS_CONNECTION_STRING")

    if not connection_string:
        logger.error("SERVICE_BUS_CONNECTION_STRING environment variable not set")
        return

    logger.info(f"Starting worker for queue: {queue_name}")

    # Initialize Service Bus client
    try:
        if connection_string.startswith("https://"):
            # Key Vault reference - use managed identity
            logger.info("Using managed identity for Service Bus authentication")
            credential = DefaultAzureCredential()
            sb_client = ServiceBusClient(
                fully_qualified_namespace=connection_string, credential=credential
            )
        else:
            # Direct connection string
            logger.info("Using connection string for Service Bus authentication")
            sb_client = ServiceBusClient.from_connection_string(connection_string)

        with sb_client:
            receiver = sb_client.get_queue_receiver(queue_name=queue_name)

            with receiver:
                logger.info("Worker ready to process jobs...")

                while True:
                    try:
                        # Receive messages with timeout
                        messages = receiver.receive_messages(
                            max_message_count=1, max_wait_time=30
                        )

                        for msg in messages:
                            try:
                                job_data = json.loads(str(msg))
                                process_job(job_data)
                                receiver.complete_message(msg)
                                logger.info("Job processed and completed successfully")

                            except Exception as e:
                                logger.error(f"Error processing job: {e}")
                                # Send to dead-letter queue for manual inspection
                                try:
                                    receiver.dead_letter_message(msg, reason=str(e))
                                except Exception as dlq_error:
                                    logger.error(
                                        f"Failed to dead-letter message: {dlq_error}"
                                    )

                    except Exception as e:
                        logger.error(f"Error receiving messages: {e}")
                        time.sleep(5)  # Brief pause before retry

    except KeyboardInterrupt:
        logger.info("Worker stopped by user")
    except Exception as e:
        logger.error(f"Worker error: {e}")
        raise


if __name__ == "__main__":
    main()
