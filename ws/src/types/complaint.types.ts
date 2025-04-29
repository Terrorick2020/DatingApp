import {
	ClientToServerEvents,
	ServerToClientEvents,
	ResErrData,
} from './base.types'
import { ComplaintCreateDto } from '@/app/complaint/dto/complaint-create.dto'
import { ComplaintUpdateDto } from '@/app/complaint/dto/complaint-update.dto'

export enum ComplaintStatus {
	PENDING = 'PENDING',
	UNDER_REVIEW = 'UNDER_REVIEW',
	RESOLVED = 'RESOLVED',
	REJECTED = 'REJECTED',
}

export enum ComplaintType {
	OFFENSIVE_CONTENT = 'OFFENSIVE_CONTENT',
	FAKE_PROFILE = 'FAKE_PROFILE',
	HARASSMENT = 'HARASSMENT',
	INAPPROPRIATE_PHOTO = 'INAPPROPRIATE_PHOTO',
	SPAM = 'SPAM',
	UNDERAGE_USER = 'UNDERAGE_USER',
	OTHER = 'OTHER',
}

export enum ComplaintServerMethods {
	CreateComplaint = 'CreateComplaint',
	UpdateComplaint = 'UpdateComplaint',
	ComplaintStatusChanged = 'ComplaintStatusChanged',
}

export enum ComplaintClientMethods {
	ComplaintCreated = 'ComplaintCreated',
	ComplaintUpdated = 'ComplaintUpdated',
	ComplaintStatusUpdated = 'ComplaintStatusUpdated',
}

export interface ComplaintCreateResponse {
	id: string
	status: ComplaintStatus
	type: ComplaintType
	createdAt: number
}

export interface ComplaintUpdateResponse {
	id: string
	status: ComplaintStatus
	updatedAt: number
	resolutionNotes?: string
}

export interface ComplaintClientToServerEvents extends ClientToServerEvents {
	[ComplaintServerMethods.CreateComplaint]: (
		complaintData: ComplaintCreateDto
	) => Promise<void>
	[ComplaintServerMethods.UpdateComplaint]: (
		complaintData: ComplaintUpdateDto
	) => Promise<void>
}

export interface ComplaintServerToClientEvents extends ServerToClientEvents {
	[ComplaintClientMethods.ComplaintCreated]: (
		response: ComplaintCreateResponse | ResErrData
	) => Promise<void>
	[ComplaintClientMethods.ComplaintUpdated]: (
		response: ComplaintUpdateResponse | ResErrData
	) => Promise<void>
	[ComplaintClientMethods.ComplaintStatusUpdated]: (
		response: ComplaintUpdateResponse
	) => Promise<void>
}
