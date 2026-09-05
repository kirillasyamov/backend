import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
	MediaServiceControllerMethods,
	type MediaServiceController as MediaServiceControllerInterface,
	type RequestUploadUrlRequest,
	type RequestUploadUrlResponse,
	type GetFileMetadataRequest,
	type GetFileMetadataResponse,
	type GetDownloadUrlRequest,
	type GetDownloadUrlResponse,
	type DeleteFileRequest,
	type ListFilesRequest,
	type ListFilesResponse,
} from '@kirillasyamov/common/contracts/generated/media';
import { MediaService } from './media.service';
import { HEALTH_STATUS_SERVING } from './media.constants';

@Controller()
@MediaServiceControllerMethods()
export class MediaController implements MediaServiceControllerInterface {
	constructor(private readonly mediaService: MediaService) {}

	@GrpcMethod('Health', 'Check')
	public check(): { status: number } {
		return { status: HEALTH_STATUS_SERVING };
	}

	public async requestUploadUrl(request: RequestUploadUrlRequest): Promise<RequestUploadUrlResponse> {
		return this.mediaService.requestUploadUrl(request);
	}

	public async getFileMetadata(request: GetFileMetadataRequest): Promise<GetFileMetadataResponse> {
		return this.mediaService.getFileMetadata(request);
	}

	public async getDownloadUrl(request: GetDownloadUrlRequest): Promise<GetDownloadUrlResponse> {
		return this.mediaService.getDownloadUrl(request);
	}

	public async deleteFile(request: DeleteFileRequest): Promise<void> {
		return this.mediaService.deleteFile(request);
	}

	public async listFiles(request: ListFilesRequest): Promise<ListFilesResponse> {
		return this.mediaService.listFiles(request);
	}
}
