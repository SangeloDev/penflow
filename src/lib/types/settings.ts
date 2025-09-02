interface Options {
  version: number;
  general: {
    visited: boolean; // whether or not penflow has been initialised
    s3AttachmentEndpoint?: string; // the s3 bucket to upload image files to
  };
}

export type { Options };
