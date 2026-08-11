// The exchange (marketplace + direct requests) stays locked behind a
// "coming soon" state until this many hotels have verified - shows
// credibility/momentum during the trial instead of an empty network.
// Hotels can still sign up, get verified, and list nights the whole time.
export const LAUNCH_THRESHOLD = 500;
