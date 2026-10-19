/**
 * Turns an UPPER_SNAKE / lower_snake status code into readable text,
 * e.g. "IN_PROGRESS" -> "In progress". Fallback for codes we don't map.
 */
export const humanizeStatus = (value: string): string => {
  const words = value.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** Strips Meta's "Error: " / "In Progress: " prefix from a container `status`. */
const stripMetaPrefix = (status: string): string =>
  status.replace(/^[A-Za-z ]+:\s*/, '').trim();

export const instagramStatusMessage = (
  statusCode: string,
  metaStatus?: string | null,
): string => {
  switch (statusCode) {
    case 'IN_PROGRESS':
      return 'Instagram is processing your Reel.';
    case 'FINISHED':
      return 'Instagram finished processing your Reel.';
    case 'PUBLISHED':
      return 'This Reel has already been published.';
    case 'EXPIRED':
      return 'This prepared Reel expired because it wasn’t published within 24 hours. Prepare it again to publish.';
    case 'ERROR': {
      const detail = metaStatus ? stripMetaPrefix(metaStatus) : '';
      return detail
        ? `Instagram couldn’t process this video: ${detail}`
        : 'Instagram couldn’t process this video. Check that it meets Reels requirements and try again.';
    }
    default:
      return `Instagram status: ${humanizeStatus(statusCode)}.`;
  }
};

export const tiktokStatusMessage = (
  status: string,
  failReason?: string | null,
): string => {
  switch (status) {
    case 'PROCESSING_UPLOAD':
      return 'TikTok is receiving your video.';
    case 'PROCESSING_DOWNLOAD':
      return 'TikTok is downloading your video.';
    case 'SEND_TO_USER_INBOX':
      return 'Your video is in your TikTok inbox. Open the TikTok app to finish posting.';
    case 'PUBLISH_COMPLETE':
      return 'Your video has been posted on TikTok.';
    case 'FAILED':
      return failReason
        ? `TikTok couldn’t process this video: ${humanizeStatus(failReason)}.`
        : 'TikTok couldn’t process this video.';
    default:
      return `TikTok status: ${humanizeStatus(status)}.`;
  }
};

export const youtubeStatusMessage = (
  processingStatus: string,
  failureReason?: string | null,
): string => {
  switch (processingStatus) {
    case 'processing':
      return 'YouTube is processing your video.';
    case 'succeeded':
      return 'YouTube finished processing your video.';
    case 'failed':
      return failureReason
        ? `YouTube couldn’t process this video: ${humanizeStatus(failureReason)}.`
        : 'YouTube couldn’t process this video.';
    case 'terminated':
      return 'YouTube stopped processing this video.';
    default:
      return `YouTube status: ${humanizeStatus(processingStatus)}.`;
  }
};
