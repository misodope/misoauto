import { Injectable, Logger } from '@nestjs/common';
import { Job, JobsOptions } from 'bullmq';
import { QueueService } from '@backend/system/queue';
import { QUEUE_NAMES, JOB_NAMES } from './jobs.constants';
import { PublishVideoPostJobData } from './jobs.types';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(private readonly queueService: QueueService) {}

  async enqueuePublishVideoPost(
    data: PublishVideoPostJobData,
    options?: JobsOptions,
  ): Promise<Job<PublishVideoPostJobData>> {
    this.logger.log(`Enqueueing publish job for video post ${data.videoPostId}`);
    return this.queueService.addJob<PublishVideoPostJobData>(
      QUEUE_NAMES.VIDEO_POST,
      JOB_NAMES.PUBLISH_VIDEO_POST,
      data,
      options,
    );
  }

  async enqueuePublishVideoPostBulk(
    posts: PublishVideoPostJobData[],
  ): Promise<Job<PublishVideoPostJobData>[]> {
    this.logger.log(`Enqueueing ${posts.length} publish jobs in bulk`);
    return this.queueService.addBulkJobs<PublishVideoPostJobData>(
      QUEUE_NAMES.VIDEO_POST,
      posts.map((data) => ({
        name: JOB_NAMES.PUBLISH_VIDEO_POST,
        data,
      })),
    );
  }
}
