// ============================================================================
// API Response Types
// ============================================================================

export interface Target {
    user_id: string;
    added_at: number;
    label: string | null;
    notes: string | null;
    priority: number;
    active: number;
}

export interface SentinelEvent {
    id: number;
    target_id: string;
    event_type: string;
    timestamp: number;
    data: string;
    guild_id: string | null;
    channel_id: string | null;
}

export interface ProfileSnapshot {
    id: number;
    target_id: string;
    timestamp: number;
    username: string | null;
    global_name: string | null;
    discriminator: string | null;
    avatar_hash: string | null;
    banner_hash: string | null;
    bio: string | null;
    pronouns: string | null;
    accent_color: number | null;
    connected_accounts: string | null;
    mutual_guilds: string | null;
}

export interface PresenceSession {
    id: number;
    target_id: string;
    status: string;
    platform: string | null;
    start_time: number;
    end_time: number | null;
    duration_ms: number | null;
}

export interface ActivitySession {
    id: number;
    target_id: string;
    activity_name: string;
    activity_type: number;
    application_id: string | null;
    details: string | null;
    state: string | null;
    start_time: number;
    end_time: number | null;
    duration_ms: number | null;
    metadata: string | null;
}

export interface VoiceSession {
    id: number;
    target_id: string;
    guild_id: string;
    channel_id: string;
    channel_name: string | null;
    start_time: number;
    end_time: number | null;
    duration_ms: number | null;
    self_mute: number;
    self_deaf: number;
    streaming: number;
    co_participants: string | null;
}

export interface MessageRecord {
    message_id: string;
    target_id: string;
    channel_id: string;
    guild_id: string | null;
    content: string | null;
    content_length: number;
    attachment_count: number;
    embed_count: number;
    is_reply: number;
    reply_to_user_id: string | null;
    created_at: number;
    edited_at: number | null;
    deleted_at: number | null;
    edit_history: string | null;
    word_count: number;
    emoji_count: number;
    mention_count: number;
    link_count: number;
}

export interface DailySummary {
    target_id: string;
    date: string;
    online_minutes: number;
    idle_minutes: number;
    dnd_minutes: number;
    offline_minutes: number;
    message_count: number;
    edit_count: number;
    delete_count: number;
    ghost_type_count: number;
    voice_minutes: number;
    activity_minutes: string;
    reaction_count: number;
    first_seen: number | null;
    last_seen: number | null;
    peak_hour: number | null;
}

export interface AlertRule {
    id: number;
    target_id: string | null;
    rule_type: string;
    condition: string;
    enabled: number;
    created_at: number;
}

export interface AlertHistoryItem {
    id: number;
    rule_id: number;
    target_id: string;
    alert_type: string;
    message: string;
    timestamp: number;
    acknowledged: number;
}

export interface TargetStatus {
    target: Target | null;
    presence: { status: string; platform: string | null; clientStatus: any } | null;
    activities: { name: string; type: number; details?: string; state?: string }[];
    voiceState: { guildId: string; channelId: string; selfMute: boolean; selfDeaf: boolean; streaming: boolean } | null;
    profile: ProfileSnapshot | null;
}

export interface SentinelStatus {
    uptime: number;
    uptimeFormatted: string;
    eventCount: number;
    targetCount: number;
    activeTargets: number;
    dbSizeBytes: number;
    dbSizeMB: number;
    startedAt: number;
}

export interface TimelineResponse {
    events: SentinelEvent[];
    presenceSessions: PresenceSession[];
    activitySessions: ActivitySession[];
    voiceSessions: VoiceSession[];
}

export interface SleepSchedule {
    estimatedBedtime: string | null;
    estimatedWakeTime: string | null;
    avgSleepDurationHours: number | null;
    weekdayBedtime: string | null;
    weekendBedtime: string | null;
    weekdayWakeTime: string | null;
    weekendWakeTime: string | null;
    irregularities: string[];
    confidence: number;
    dataPoints: number;
}

export interface RoutinePattern {
    weeklyGrid: { dayOfWeek: number; hour: number; eventCount: number; dominantType: string | null; isTypical: boolean }[][];
    summary: string[];
    anomalies: string[];
}

export interface SocialConnection {
    userId: string;
    score: number;
    messageInteractions: number;
    reactionInteractions: number;
    voiceTime: number;
    mentionCount: number;
    relationship: string;
}

export interface Anomaly {
    type: string;
    severity: "low" | "medium" | "high";
    description: string;
    timestamp: number;
}

export interface CommunicationProfile {
    avgMessageLength: number;
    avgWordCount: number;
    vocabularyRichness: number;
    emojiRate: number;
    editRate: number;
    deleteRate: number;
    ghostTypeRate: number;
    messagesByHour: number[];
    linkShareRate: number;
    attachmentRate: number;
    replyRate: number;
    totalMessages: number;
}

export interface GamingProfileData {
    games: { name: string; totalPlaytimeMs: number; sessionCount: number; avgSessionMs: number; firstPlayed: number; lastPlayed: number; peakHour: number; peakDay: number }[];
    totalGamingMs: number;
    peakGamingHour: number;
    recentlyStarted: string[];
    abandoned: string[];
}

export interface MusicProfileData {
    topArtists: { name: string; listens: number; totalMs: number }[];
    topSongs: { name: string; artist: string; listens: number }[];
    totalListeningMs: number;
    listeningByHour: number[];
    sessionCount: number;
    recentTrack: { song: string; artist: string; album: string } | null;
}

export interface VoiceHabitsData {
    totalVoiceMs: number;
    sessionCount: number;
    avgSessionMs: number;
    byHour: number[];
    byDay: number[];
    preferredChannels: { channelId: string; guildId: string; totalMs: number; sessions: number }[];
    muteRatio: number;
    deafRatio: number;
    streamingMs: number;
    topPartners: { userId: string; sharedMs: number }[];
}

// ============================================================================
// New data types (briefs, backfill, config, correlations, runtime)
// ============================================================================

export interface DailyBrief {
    id: number;
    target_id: string;
    date: string;
    brief_text: string;
    generated_at: number;
}

export interface BackfillChannelRow {
    id: number;
    target_id: string;
    guild_id: string;
    channel_id: string;
    status: "pending" | "in_progress" | "completed" | "failed" | "skipped" | "paused";
    messages_found: number;
    oldest_message_id: string | null;
    started_at: number | null;
    completed_at: number | null;
    error: string | null;
}

export interface BackfillProgress {
    summary: {
        total: number;
        pending: number;
        in_progress: number;
        completed: number;
        failed: number;
        skipped: number;
        paused: number;
        totalMessagesFound: number;
    };
    channels: BackfillChannelRow[];
}

export interface TargetConfig {
    target_id: string;
    social_weight_messages: number;
    social_weight_reactions: number;
    social_weight_voice_hours: number;
    social_weight_mentions: number;
    anomaly_z_threshold: number;
    updated_at?: number;
}

export interface EventCorrelation {
    triggerType: string;
    followType: string;
    occurrences: number;
    avgDelayMs: number;
    lift: number;
    confidence: number;
}

export type RuntimeKey =
    | "DISCORD_TOKEN"
    | "ALERT_WEBHOOK_URL"
    | "CRITICAL_WEBHOOK_URL"
    | "AI_PROVIDER"
    | "AI_MODEL"
    | "AI_API_KEY"
    | "AI_BASE_URL"
    | "AI_ANALYSIS_INTERVAL_MS"
    | "AI_CATEGORIZATION_BATCH_SIZE"
    | "SUPABASE_URL"
    | "SUPABASE_SERVICE_KEY"
    | "SUPABASE_SYNC_INTERVAL_MS"
    | "BACKFILL_ENABLED"
    | "BACKFILL_MAX_DAYS"
    | "BACKFILL_MAX_MESSAGES_PER_CHANNEL"
    | "ALERT_DIGEST_MODE"
    | "ALERT_DIGEST_INTERVAL_MS"
    | "ALERT_FATIGUE_THRESHOLD"
    | "BRIEF_GENERATION_TIME"
    | "PROFILE_POLL_INTERVAL_MS"
    | "STATUS_POLL_INTERVAL_MS"
    | "DAILY_SUMMARY_INTERVAL_MS";

export type RuntimeConfig = Record<RuntimeKey, string>;

// ============================================================================
// UI Types
// ============================================================================

export type TabId = "dashboard" | "target" | "runtimeconfig";
export type TargetTab =
    | "overview" | "timeline" | "analytics" | "profile"
    | "insights" | "messages" | "alerts"
    | "briefs" | "backfill" | "config";
export type AnalyticsSubTab = "presence" | "activities" | "messages" | "voice" | "music" | "social";

export interface SSEEvent {
    target_id: string;
    event_type: string;
    timestamp: number;
    data: any;
}
