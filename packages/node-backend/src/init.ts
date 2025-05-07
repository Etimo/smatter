import { Types } from "mongoose";
import { User } from "./model/user";
import { PostRepository } from "./repository/posts/postrepository";
import { UserRepository } from "./repository/users/userrepository";
/**
 * This file just seeds the DB with smatterers, sets up followers and a few smats...
 */
const input = `@SarahJones; Just got back from the most amazing vacation! Anyone else have any fun trips recently? #travel; sara@gmail.com
@MarkDavis; Ah, nice! I've been stuck in the office all week. Anyone know of any good productivity hacks?; #worklife mark@coolguy.se
@EmilyWang; Ooh, I just tried the Pomodoro technique and it's been a game-changer! #productivitytips; wangthang@bill.com
@TommyLee; Yeah, I use Trello to stay organized. What do you guys think of project management tools? #pmtools; cats4life@cats4pies
@RuthBrown; Anyone have any good book recommendations? I just finished "The Hitchhiker's Guide" and I need something new! #books; catastrophe@sweet.com
@JessicaLiu; OMG, yes! I just devoured "The Nightingale" by Kristin Hannah. Highly recommend! #bookclub; Whooo@whyyy.com
@BenjaminKim; Thanks for the rec, Jessica! Anyone have any good movie suggestions? We're in the mood for a rom-com... #movies; where@when.com
@NatalieHernandez; Ahaha, I just watched "To All The Boys I've Loved Before" and it's SO CUTE! #NetflixAndChill; me@you.com
@DavidLee; Hey guys, anyone have any good music recommendations? I'm looking for some new tunes to get pumped up! #music; apple@orange.com
@ChristineWong; Ooh, I just discovered this amazing indie band, The 1975. Give them a listen if you haven't already! #indiemusic; banana@fobi.com`;

const bios = `
 Software engineer by day, bread enthusiast by night - always whipping up a storm in the kitchen!
 Outdoor lover at heart, spending weekends camping and hiking with friends (and occasionally getting lost).
 Data analyst by trade, but don't be fooled - I'm secretly a professional coffee snob.
 Part-time bookworm, full-time cat lady - surrounded by pages and purrs.
 Aspiring chef, part-time couch potato - always on the lookout for new recipe ideas (and TV shows to binge).
 Yoga instructor with a passion for all things wellness - balanced life, one downward-facing dog at a time!
 Weekend warrior and amateur DJ spinning tunes for friends and family (and occasionally getting requests to play the Macarena).
 Adventure-seeking photographer capturing moments on the go (and occasionally getting caught in the rain).
 Book editor by day, creative writer by night - pouring over manuscripts during the day and crafting stories under the stars.
`;
const images = [
  "https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
];

export const initDb = async () => {
  const usersOne = await UserRepository.getAll();
  if (
    usersOne != undefined &&
    usersOne.find((u) => u.username === "**@RuthBrown**") != null
  ) {
    console.log("Seed user exists, exit");
    return;
  }

  const split = input.split("\n");
  const bios = input.split("\n");
  for (let i = 0; i < split.length && i < bios.length; i++) {
    const elems = split[i].split(";");

    const userDto = {
      id: new Types.ObjectId(i),
      email: elems[2],
      username: elems[0],
      bio: bios[i],
      profilePictureUrl: images[i],
      bannerPictureUrl: "https://i.redd.it/6uibjk9cug041.jpg",
      displayName: elems[0],
      password: "123456",
    };
    console.log(`Created ${JSON.stringify(userDto)}`);
    const mongoDoc = await new User(userDto).save();
    const post = await PostRepository.save({
      authorId: mongoDoc.id!.toString(),
      content: elems[1],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    /*
  const users = await UserRepository.getAll();
  users.forEach(async u =>
    users.forEach(async u2 => {if(u !== u2){
        const saveResult = await FollowingRepository.save({
            followingId: u2._id as unknown as Schema.Types.ObjectId,
            owningUserId: u._id as unknown as Schema.Types.ObjectId
          });

    }})
  )*/
  }
  /*const userDto = {
        id:
        email: user.email,
        username: user.username,
        bio: user.bio,
        profilePictureUrl: user.profilePictureUrl,
        bannerPictureUrl: user.bannerPictureUrl,
        displayName: user.displayName,
        isMyself: user._id.toString() === getContext().user._id.toString(),
      };*/
};
