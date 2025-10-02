interface Options {
  version: number;
  general: {
    visited: string; // whether or not penflow has been initialised
    // s3AttachmentEndpoint?: string; // the s3 bucket to upload image files to
    s3: {
      endpoint?: string;
      accessKey?: string;
      secretKey?: string;
      region?: string;
      bucket?: string;
    };
  };
}

export type { Options };
