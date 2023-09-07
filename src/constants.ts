export namespace AUTH_CONTANTS {
  // 3 hours as milliseconds
  export const CACHE_TIME = 10_800_000;
}

export namespace MESSAGE_FILE {
  // 3 hours as milliseconds
  export const CACHE_TIME = 10_800_000;

  // 25 MiB
  export const MAX_FILE_SIZE = 26_214_400;

  // IMAGE MIME TYPES
  export const IMAGE_MIME_TYPES =
    /image\/(jpe?g|png|gif|bmp|webp|svg\+xml|tiff)/;

  // AUDIO MIME TYPES
  export const AUDIO_MIME_TYPES =
    /audio\/(aac|((x-)?midi)|mp3|mpeg|ogg|opus|wav|webm|3gpp2?)/;

  // VIDEO MIME TYPES
  export const VIDEO_MIME_TYPES = /video\/(x-msvideo|mp4|mpeg|ogg|webm|3gpp2?)/;

  // OFFICE MIME TYPES
  export const MICROSOFT_MIME_TYPES =
    /(application\/((msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|(vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)|(vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation)|onenote|vnd\.publisher|vnd\.visio|vnd\.ms-project|vnd\.ms-access))/;
  export const GOOGLE_MIME_TYPES =
    /(application\/(vnd\.google-apps\.document|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|msword)|application\/(vnd\.google-apps\.spreadsheet|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)|application\/(vnd\.google-apps\.presentation|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation))/;
  export const WPS_MIME_TYPES =
    /(application\/(vnd\.ms-word\.document\.macroEnabled\.12|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|application\/(vnd\.ms-excel\.sheet\.macroEnabled\.12|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)|application\/(vnd\.ms-powerpoint\.presentation\.macroEnabled\.12|vnd\.openxmlformats-officedocument\.presentationml\.presentation))/;
  export const OTHER_MIME_TYPES =
    /(application\/pdf|application\/rtf|text\/plain|text\/csv|text\/html|application\/xml|application\/json)/;

  export const OFFICE_MIME_TYPES = new RegExp(
    [
      MESSAGE_FILE.MICROSOFT_MIME_TYPES.source,
      MESSAGE_FILE.GOOGLE_MIME_TYPES.source,
      MESSAGE_FILE.WPS_MIME_TYPES.source,
      MESSAGE_FILE.OTHER_MIME_TYPES.source,
    ].join('|'),
  );

  // ALL MIME TYPES
  export const ALL_MIME_TYPES = new RegExp(
    [
      MESSAGE_FILE.AUDIO_MIME_TYPES.source,
      MESSAGE_FILE.VIDEO_MIME_TYPES.source,
      MESSAGE_FILE.IMAGE_MIME_TYPES.source,
      MESSAGE_FILE.OFFICE_MIME_TYPES.source,
    ].join('|'),
  );
}

export namespace COMMON_FILE {
  // 2 MiB
  export const IMAGE_MAX_FILE_SIZE = 2_097_152;

  // 25 MiB
  export const MAX_FILE_SIZE = 26_214_400;

  export const IMAGE_MIME_TYPES = /image\/(jpe?g|png)/;

  export const OFFICE_MIME_TYPES =
    /(application\/pdf|application\/rtf|text\/plain|text\/csv|text\/html|application\/xml|application\/json)/;
}
