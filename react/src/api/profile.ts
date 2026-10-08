export type UserProfile = {
  uid: string;
  name: string;
  avatarUrl: string;
  bio: string;
  majors: string[];
  eventIds: string[];
};

export async function getProfile(userId: string): Promise<UserProfile> {
  return {
    uid: userId,
    name: "John Smith",
    avatarUrl:
      "https://media.licdn.com/dms/image/v2/D4E03AQHh4I_UBZAakg/profile-displayphoto-scale_200_200/B4EZyMBTedGsAY-/0/1771875678871?e=2147483647&v=beta&t=dx22s-bmuZg2lSymIIuVOtsza3fLNMc-Ol0d-3dcFfc",
    bio: "My bio",
    majors: ["Computer Science", "Music"],
    eventIds: ["123", "456", "789"],
  };
}
