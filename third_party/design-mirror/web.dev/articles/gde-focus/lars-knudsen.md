---
source_url: https://web.dev/articles/gde-focus/lars-knudsen
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:40+00:00
sha256: 474a032d3b2f8446ef548ab8e71086f0be2d1ed30458ec58034c6db0ba5888df
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Lars Knudsen is a Google Developer Expert, we talked to him about how a $10 device can make computers more accessible for people with disabilities.

Monika Janota

**Monika:** What inspired you to become a developer? What's your current professional focus?

**Lars:** I got my MSc in engineering, but in fact my interest in tech started much earlier. When I was a kid in the 80s, my father owned a computing company working with graphic design. Sometimes, especially during the summer holidays, he would take me to work with him. At times, some of his employees would keep an eye on me. There was this really smart guy who once said to me, "Lars, I need to get some work done, but here's a C manual, and there's a computer over there. Here's how you start a C compiler. If you have any questions, come and ask me." I started to write short texts that were translated into something the computer could understand. It seemed magical to me. I was 11 years old when I started and around seventh grade, I was able to create small applications for my classmates or to be used at school. That's how it started.

Over the years, I've worked for many companies, including Nokia, Maersk, and Openwave. At the beginning, like in many other professions, because you know a little, you feel like you can do everything, but with time you learn each company has a certain way of doing things.

After a few years of working for a medical company, I started my own business in 1999. I worked as a freelance contractor and, thanks to that, had the chance to get to know multiple organizations quickly. After completing the first five contracts, I found out that every company thinks they've found the perfect setup, but all of them are completely different. At that time, I was also exposed to a lot of different technologies, operating systems etc. Around my early twenties, my mindset changed. At the beginning, I was strictly focused on one technology and wanted to learn all about it. With time, I started to think about combining technologies as a way of improving our lives. I have a particular interest in narrowing the gap between what we call the A and the B team in the world. I try to transfer as much knowledge as possible to regions where people don't have the luxury of owning a computer or studying at university free of charge.

I continue to work as a contractor for external partners but, whenever possible, I try to choose projects that have some kind of positive impact on the environment or society. I'm currently working on embedded software for a hearing-aid company called [Oticon](https://www.oticon.com/). Software-wise, I've been working on everything from the tiniest microcontrollers to the cloud; a lot of what I do revolves around the web. I'm trying to combine technologies whenever it makes sense.

**Monika**: Were you involved in developer communities before joining the Google Developer Experts program?

**Lars:** Yes, I was engaged in meetups and conferences. I first connected with the community while working for Nokia. Around 2010, I met [Kenneth Rohde Christiansen](https://twitter.com/kennethrohde?ref_src=twsrc%5Egoogle%7Ctwcamp%5Eserp%7Ctwgr%5Eauthor), who became a GDE before me. He inspired me to see how web technologies can be useful for aspiring tech professionals in developing countries. Developing and deploying solutions using C++, C# or Java requires some years of experience, but everyone who has access to a computer, browser, and notepad can start developing web-based applications and learn really fast. It's possible to build a fully functional application with limited resources, and ramp up from nothing. That's why I call the web a very democratizing technology stack.

But back to the community---after a while I got interested in web standardization and what problems bleeding edge web technologies could solve. I experimented with new capabilities in a browser before release. I was working for Nokia at the time, developing for a Linux-based flagship device, the N9. The browser we built was WebKit based and I got some great experience developing features for a large open source project. In the years after leaving Nokia, I got involved in web conferences and meetups, so it made sense to join the GDE community in 2017.

I really enjoy the community work and everything we're doing together, especially the pre-pandemic Chrome Developer Summits, where I got to help with booth duty alongside a bunch of awesome Google Engineers and other GDEs.

**Monika:** What advice would you give to a young developer who's just starting their professional career and is not sure which path to take?

**Lars**: I'd say from my own experience---if you can afford it---consider freelancing for a couple of different companies. This way, you'll be exposed to code in many different forms and stages of development. You'll get to know a multitude of operating systems and languages, and learn how to resolve problems in many ways. This helped me a lotI gained experience as senior developer in my twenties. This approach will help you achieve your professional goals faster.

Besides that, have fun, explore, play with the hardware and software. Consider building something that solves a real problem---maybe for your friends, family, or a local business. Don't be afraid to jump into something you've never done before.

**Monika:** What does the future hold for web technologies?

**Lars:** I think that for a couple of years now the web has been fully capable of providing a platform for large field applications, both for the consumer and for business. On the server side of things, web technologies offer a seamless experience, especially for frontend developers who want to build a backend component. It's easier for them to get started now. I know people who were using both Firebase and Heroku to get the job done. And this trend will grow---web technologies will be enough to build complex solutions of any kind. I believe that the [Web Capabilities - Project Fugu 🐡](https://www.chromium.org/teams/web-capabilities-fugu/) really unlocks that potential.

Looking at it from a slightly different point of view, I also think that if we provide full documentation and in-depth articles not only in English but also in other languages (for example, Spanish and Portuguese), we would unlock a lot of potential in Latin America---and other regions, of course. Developers there often don't know English well enough to fully understand all the relevant articles. We should also give them the opportunity to learn as early as possible, even before they start university, while still in their hometowns. They may use those skills to help local communities and businesses before they leave home and maybe never come back.

**Thomas:** You came a long way from doing C development on a random computer to hacking on hardware. How did you do that?

**Lars:** I started taking apart a lot of hardware I had at home. My dad was not always happy when I couldn't put it back together. With time, I learned how to build some small devices, but it really took off much later, around the time I joined Nokia, where I got my embedded experience. I had the chance to build small screensavers, components for the Series 30 phones. I was really passionate about it and could really think outside the box. They assigned me a task to build a Snake game for those devices. It was a very interesting experience. The main difference between building embedded systems and most other things (including web) is that you leave a small footprint---you don't have much space or memory to use. While building Snake, the RAM that I had available was less than one-third of the frame buffer (around 120 x 120 pixels). I had to come up with ways to algorithmically rejoin components on screen so they'd look static, as if they were tiles. I learned a lot---that was the move from larger systems to small, embedded solutions.

**Thomas:** The skill set of a typical frontend developer is very different from the skill set of someone who builds embedded hardware. How would you encourage a frontend developer to look into hardware and to start thinking in binary?

**Lars:** I think that the first step is to look at some of the [Fugu APIs](https://fugu-tracker.web.app/) that work in Chrome and Edge, and are built into all the major systems today. That's all you need at the start.

Another thing is that the toolchains for building embedded solutions have a steep learning curve. If you want to build your own custom hardware, start with [Arduino](https://www.arduino.cc/) or [ESP32](http://esp32.net/)---something that is easy to buy and fairly cheap. With the right development environment, you can get your project up and running in no time.

You could also buy a heart rate monitor or a multisensor unit, which are already using Bluetooth GATT services, so you don't have to build your own hardware or firmware---you can use what's already there and start experimenting with the Web Bluetooth API to start communicating with it.

There are also devices that use a serial protocol---for these, you can use the [Web Serial API](https://developer.mozilla.org/docs/Web/API/Web_Serial_API) ([also Fugu](https://fugu-tracker.web.app/)). Recently I've been looking into using the [WebHID API](https://developer.mozilla.org/docs/Web/API/WebHID_API), which enables you to talk to all the human interface devices that everyone has access to. I found some old ones in my basement that had not been supported by any operating system for years, but thanks to reverse engineering it took me a few hours to re-enable them.

There are different approaches depending on what you want to build, but to a web developer I would say, get a solid sensor unit, maybe a Thingy 52 from Nordic Semiconductor; it has a lot of sensors, and you can hook up to your web application with very little effort.

**Thomas:** Connecting to the device is the first step, but then speaking to it effectively---that's a whole other thing. How come you did not give up after facing obstacles? What kept you motivated to continue working?

**Lars:** For me personally the social aspect of solving a problem was the most important. When I started working on my own embedded projects, I had a vision and a desire to build a science lab in a box for developing regions. My wife is from Mexico and I saw some of the schools there; some that are located outside of the big cities are pretty shabby, without access to the materials and equipment that we have in our part of the world.

The passion for building something that can potentially be used to help others---that's what kept me going. I also really enjoyed the community support. I reached out to some people at Google and all were extremely helpful and patiently answered all of my questions.

**Thomas:** A lot of people have some sort of hardware at home, but don't know what to do with it. How do you find inspiration for all your amazing projects, in particular the one under the working name [SimpleMouse](https://dev.to/denladeside/zephyr-web-bluetooth-and-accessibility-4ddm)?

**Lars:** Well, recently I have been in fact reviving a lot of old hardware, but for this particular project---the name has not been set yet, but let's call it SimpleMouse---I used my experience. I worked with some accessibility solutions earlier and I saw how some of them just don't work anymore; you'd need to have an old Windows XP with certain software installed to run them. You can't really update those, you can only use those at home because you can't move your setup.

Because of that, I wondered how to combine my skills from the embedded world with project Fugu and what is now possible on the web to create cheap, affordable hardware combined with easy-to-understand software on both sides, so people can build on that.

For that particular project, I took a small USB dongle with a reflexive chip, the nRF52840. It communicates with Bluetooth on one side and USB on the other. You can basically program it to be anything on both sides. And then I thought about the devices that control a computer---a mouse and a keyboard. Some people with disabilities may find it difficult to operate those devices, and I wanted to help them.

The first thing I did was to make sure that any operating system would see the USB dongle as a mouse. You can control it from a native application or a web application---directly into Bluetooth. After that, I built a web application---a simple template that people can extend the way they want using web components. Thanks to that, everyone can control their computer with a web app that I made in just a couple of hours on an Android phone.

Having that set up will enable anyone in the world with some web experience to build, in a matter of days, a very customized solution for anyone with a disability who wants to control their computer. The cool thing is that you can take it with you anywhere you go and use it with other devices as well. It will be the exact same experience. To me, the portability and affordability of the device are very important because people are no longer confined to using their own devices, and are no longer limited to one location.

**Thomas:** Did you have a chance to test the device in real life?

**Lars:** Actually during my last trip to Mexico I discussed it with a web professional living there; he's now looking into the possibilities of using the device locally. Over there the equipment is really expensive, but a USB dongle normally costs around ten US dollars. He's now checking if we could build local setups there to try it out. But I haven't done official trials yet here in Denmark.

**Thomas:** Many devices designed to assist people with disabilities are really expensive. Are you planning on cooperating with any particular company and putting it into production for a fraction of the price of that expensive equipment?

**Lars:** Yes, definitely! I've already been talking to a local hardware manufacturer about that. Of course, the device won't replace all those highly specialized solutions, but it can be the first step to building something bigger---for example, using voice recognition, already available for web technologies. It'll be an easy way of controlling devices using your Android phone; it can work with a device of any kind.

Just being able to build whatever you want on the web and to use that to control any host computer opens up a lot of possibilities.

**Thomas:** Are you releasing your Zephyr project as open source? What kind of license do you use? Are there plans to monetize the project?

**Lars:** Yes, the solution is open source. I did not put a specific license on it, but I think Apache 2.0 would be the way to go. Many major companies use this license, including Google. When I worked on SimpleMouse, I did not think about monetizing the project---that was not my goal. But I also think it would make sense to try to put it into production in some way, and with this comes cost. The ultimate goal is to make it available. I'd love to see it being implemented at a low cost and on a large scale.
