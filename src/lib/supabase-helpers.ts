import { supabase } from "@/integrations/supabase/client";

export async function getCurrentProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  
  return data;
}

export async function getDiscoverableProfiles(userId: string) {
  // Get already swiped user IDs
  const { data: swipedData } = await supabase
    .from("swipes")
    .select("swiped_id")
    .eq("swiper_id", userId);
  
  const swipedIds = swipedData?.map(s => s.swiped_id) || [];
  const excludeIds = [userId, ...swipedIds];

  const { data } = await supabase
    .from("profiles")
    .select("id, name, age, gender, bio, photos, role, verified")
    .eq("status", "active")
    .not("id", "in", `(${excludeIds.join(",")})`)
    .not("name", "eq", "")
    .limit(20);

  return data || [];
}

export async function handleSwipe(swipedId: string, direction: "left" | "right") {
  const { data, error } = await supabase.rpc("handle_swipe", {
    p_swiped_id: swipedId,
    p_direction: direction,
  });
  if (error) throw error;
  return data as { matched: boolean; match_id?: string };
}

export async function getMatches(userId: string) {
  const { data } = await supabase
    .from("matches")
    .select(`
      id,
      status,
      created_at,
      user1_id,
      user2_id
    `)
    .eq("status", "active")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getMatchProfile(matchUserId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("id, name, age, gender, bio, photos, role, verified")
    .eq("id", matchUserId)
    .single();
  return data;
}

export async function getMessages(matchId: string) {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });
  return data || [];
}

export async function sendMessage(matchId: string, senderId: string, message: string) {
  const { error } = await supabase
    .from("messages")
    .insert({ match_id: matchId, sender_id: senderId, message });
  if (error) throw error;
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);
  if (error) throw error;
}

export async function sendFriendRequest(addresseeId: string) {
  const { error } = await supabase
    .from("friendships")
    .insert({ requester_id: (await supabase.auth.getUser()).data.user!.id, addressee_id: addresseeId });
  if (error) throw error;
}

export async function respondFriendRequest(friendshipId: string, status: "accepted" | "rejected") {
  const { error } = await supabase
    .from("friendships")
    .update({ status })
    .eq("id", friendshipId);
  if (error) throw error;
}

export async function followUser(followingId: string) {
  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: (await supabase.auth.getUser()).data.user!.id, following_id: followingId });
  if (error) throw error;
}

export async function unfollowUser(followId: string) {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("id", followId);
  if (error) throw error;
}

export async function sendDirectMessage(receiverId: string, message: string) {
  const { error } = await supabase
    .from("direct_messages")
    .insert({ sender_id: (await supabase.auth.getUser()).data.user!.id, receiver_id: receiverId, message });
  if (error) throw error;
}

export async function getDirectMessages(otherUserId: string) {
  const userId = (await supabase.auth.getUser()).data.user!.id;
  const { data } = await supabase
    .from("direct_messages")
    .select("*")
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
    .order("created_at", { ascending: true });
  return data || [];
}
