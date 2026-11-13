---
source_url: https://web.dev/learn/accessibility/why
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:04+00:00
sha256: 89a3a94d7d1e4a6529bc1b4afd4cb376537cc948f9f73a1e2911d4ac99a7d83b
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Design and build websites and web apps that people with disabilities can
interact with in a meaningful and equivalent way. Read about the business and
legal impact of these choices.

Imagine a world where you couldn't buy a present for a friend because the
online shopping cart was incompatible with your device. Or a world where you
had to ask a coworker to help you understand the recent sales chart because it
only used soft monotone colors. Maybe you couldn't enjoy that new show
everyone's been talking about because the captions are missing or badly
automated.

For some people, this world is an everyday reality. But it doesn't have to be
this way---this is a reality you can help change when you make digital
accessibility a priority. Digital accessibility, commonly abbreviated to
[a11y](https://www.a11yproject.com/posts/a11y-and-other-numeronyms/), is about
designing and building digital products so that, regardless of a person's
disability, they can still interact with the product in a meaningful and
equivalent way.

Beyond the typical leadership buy-in, time, effort, and budget that are
required of any project, building digital products with full inclusivity in
mind also requires:

- Expert knowledge of various accessibility standards.
- Understanding the fundamentals of accessible designs and code.
- Understanding the importance of using multiple testing techniques and tools.

Most importantly, true inclusivity can only come when you include people with
disabilities and accessibility best practices into the full product
lifecycle---from planning, to designing, to coding, and more.

## What is the individual impact?

The [World Health Organization](https://www.who.int/teams/noncommunicable-diseases/sensory-functions-disability-and-rehabilitation/world-report-on-disability)
(WHO) estimates that over 15% of the world's population---or 1.3 billion
people---self-identify as having a disability, making this group the largest
minority group globally.

More recent reports from the
[Centers for Disease Control and Prevention (CDC)](https://www.cdc.gov/ncbddd/disabilityandhealth/infographic-disability-impacts-all.html),
the [US Census](https://www.census.gov/content/dam/Census/library/publications/2018/demo/p70-152.pdf),
the [Academic Network of European Disability experts (ANED)](https://includ-ed.eu/sites/default/files/documents/aned_2013_task_6_-_comparative_data_synthesis_report_-_europe2020_final.pdf),
and others estimate the total number of people with disabilities to be even
greater. This number continues to grow as the world population ages and faces
chronic health conditions.

Inaccessible digital products impact people with disabilities. Some types of
disabilities are impacted more in the digital world than others.

> [!TIP]
> **Tip:** To learn more about identity and language choices, we recommend reading [Demystifying Disability: What to Know, What to Say, and How to be an Ally](https://emilyladau.com/book/) by Emily Ladau.

### Visual impairments

[Visual impairment](https://www.disabled-world.com/disability/types/vision/)
(vision impairment, vision disability) is a decreased ability to see to the
degree that causes problems not fixable by usual means, such as glasses or
medication. Visual impairment can be due to disease, trauma, or congenital or
degenerative conditions.

- *Examples*: B/blindness, low vision, color blindness
- *Prevalence* : 253 million people have visual impairment worldwide. 36 million are blind, 217 million have moderate to severe visual impairment (MSVI), according to [Community eye health volume 30](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5820628/), and 1 in 12 men and 1 in 200 women are colorblind, according to [Colour Blind Awareness](https://www.colourblindawareness.org/colour-blindness/).
- *Tools*: Screen reader software, screen magnification tools, Braille output devices.
- *Pain points*: Digital products that don't work with screen reader software, mobile websites and apps without pinch to zoom, complex graphs and charts differentiated by colors alone, color contrasts that make it difficult to read text on the screen.

> [!IMPORTANT]
> **Key Point:** Use lowercase when referring to a vision-loss condition or to a person who is blind, who prefers lowercase. Capitalize for those who capitalize Blind when describing themselves.

> "My vision has deteriorated rapidly over the last three years, and my phone's default font size ranges from large to mega-large. There are a decent amount of mobile apps that I can barely use because of their absurd font sizes."
> Frank

Read a short [article in the New York Times](https://www.nytimes.com/2022/08/16/opinion/blindness-retinitis-pigmentosa.html) or [watch a video](https://youtu.be/X04HKyW-3hc)
on what it means to be legally blind.

### Mobility impairment

[Mobility impairment](https://www.disabled-world.com/disability/types/mobility/)
is a category of disability that includes people with various physical
disabilities. This type of disability includes upper or lower limb loss or
disability, manual dexterity, and disability in coordination with different
organs of the body.

- *Examples*: Arthritis, paralysis, amputees, seizure disorders.
- *Prevalence* : [1 in 7 people have mobility issues](https://www.cdc.gov/media/releases/2018/p0816-disability.html#:%7E:text=One%20in%204%20U.S.%20adults,affects%201%20in%207%20adults).
- *Tools*: Adaptive switches, eye tracking devices, mouth and head sticks, and speech input.
- *Pain points*: Elements that are only designed to work with the use of a mouse.

> "Accessibility isn't just for people with disabilities. I had elbow
> surgery, and it temporarily changed how I managed my daily digital
> activities."
> Melissa

### Hearing impairment

A [hearing impairment or hearing loss](https://www.disabled-world.com/disability/types/hearing/)
is a full or partial decrease in the ability to detect or understand sounds.
Hearing impairments are caused by a wide range of biological and environmental
factors.

- *Examples*: D/deafness, hard of hearing (HoH), hearing impaired (HI)
- *Prevalence* : Globally, over 1.5 billion people have a low to medium level of hearing loss, while it is estimated that 66 million people have a [significant level of hearing loss](https://www.who.int/health-topics/hearing-loss#tab=tab_1).
- *Tools*: hearing aids, captions, transcripts, and sign language.
- *Pain points*: Audio content without text transcript and video without synchronized captions.

> [!IMPORTANT]
> **Key Point:** Use lowercase when referring to a hearing-loss condition or to a deaf person who prefers lowercase. Capitalize for those who identify as members of the Deaf community or when they capitalize Deaf when describing themselves.

> "Some deaf people say auto-captions are NOT better than nothing. Some
> deaf people say automatic captions ARE better than nothing. Unlike people
> with hearing, deaf people have nothing to fall back on. All they have is the
> captions. Personally, I'd rather see no captions than watch automatic
> captions. Sure, I'm disappointed there aren't captions. With no
> auto-captions, I avoid the painful experience of its notoriously bad
> captions."
> Meryl

### Cognitive impairments

A [cognitive disability](https://www.disabled-world.com/disability/types/cognitive/)
covers a variety of medical conditions affecting cognitive ability. People with
cognitive disabilities include various intellectual or cognitive deficits,
deficits too mild to properly qualify as intellectual disability, specific
conditions, and problems acquired later in life through acquired brain injuries
or neurodegenerative diseases like dementia.

- *Examples*: Down's syndrome, A/autism, ADHD, dyslexia, aphasia.
- *Prevalence*: Varies by condition.
- *Tools*: Screen readers, text highlighting, text prediction, abstractive summarization tools.
- *Pain points*: Busy interfaces that make it overly complicated to focus on the task at hand, big walls of words with little whitespace, justified text, and small or hard-to-read fonts

> [!IMPORTANT]
> **Key Point:** Use lowercase when referring to autism as a disorder or to an autistic person who prefers lowercase. Capitalize for those who capitalize Autism or Autistic when describing themselves.

> "Right now, I am recovering from an ocular migraine, and I would say dark
> mode is not helping enough. I still need contrast, but less harshly bright."
> Ruth

Read a short [New York Times article](https://www.nytimes.com/2022/08/30/opinion/face-blindness-prosopagnosia.html)
or [watch a video](https://youtu.be/3-MzNPcEh6M) on prosopagnosia, also known
as face blindness.

### Seizure and vestibular disorders

A seizure is an excessive surge of electrical activity in the brain that can
cause various symptoms, depending on which parts of the brain are involved.
Seizures may result from genetics or a brain injury, but their
[cause is often unknown](https://nyulangone.org/conditions/epilepsy-seizure-disorders-in-adults/types).

The vestibular system includes the parts of the inner ear and brain that
process the sensory information that controls balance and eye movements. If
disease or injury damages these processing areas, vestibular disorders can
result. [Vestibular disorders](https://vestibular.org/article/diagnosis-treatment/types-of-vestibular-disorders/)
can also result from or be worsened by genetic or environmental conditions or
occur for unknown reasons.

- *Examples*: Epilepsy, vertigo, dizziness, labyrinthitis, balance, and eye movement disorders.
- *Prevalence* : 50 million people worldwide have epilepsy, according to the [World Health Organization (WHO)](https://www.who.int/health-topics/epilepsy). 1.8 million adults worldwide have bilateral vestibular hypofunction (BVH), according to [Johns Hopkins Medicine](https://www.hopkinsmedicine.org/news/newsroom/news-releases/implant-improves-balance-movement-and-quality-of-life-for-people-with-inner-ear-disorder).
- *Tools* : Operating system settings to reduce motion. In Windows, this setting is framed positively as **Show animation** , and is turned off. On Android, the setting **Remove animations** is turned on.
- *Pain points*: Videos that autoplay, extreme flashing or strobing of visual content, parallax effects, or scroll-triggered animations.

> "I *really* dislike the superfluous animation that plagues iOS
> transitions between apps, so I turn it off. Downside: I'm denied most of
> the thoughtfully executed motion design on the web because there's no
> "some motion is fine" middle ground."
> Oliver

### Speech impairment

A [speech disorder](https://www.pennmedicine.org/for-patients-and-visitors/patient-information/conditions-treated-a-to-z/speech-and-language-disorders#:%7E:text=A%20speech%20disorder%20is%20a,Articulation%20disorders)
is a condition in which a person has problems creating or forming the speech
sounds needed to communicate with others.

- *Examples*: Muscular or cognitive issues that impede speech, such as apraxia, dysarthria, or stuttering.
- *Prevalence* : 18.5 million individuals have a speech, voice, or language disorder, according to the [National Institute on Deafness and Other Communication Disorders (NIDCD)](https://www.nidcd.nih.gov/health/statistics/quick-statistics-voice-speech-language)
- *Tools*: Augmentative and alternative communication (AAC) and speech-generating devices.
- *Pain points*: Voice-activated technology such as smart home devices and apps.

> "My son has a lisp due to dyspraxia. He will say "seep" rather than
> "sheep" or "fower" rather than "flower". It is sweet, but he gets so
> frustrated by voice-activated software.
>
> Our new car uses voice activation to interact with a phone. Often if we are
> together, my husband will send us a WhatsApp message. The car will read it
> out loud, but when it asks us if we want to reply, my son's reply is not understood.
> He gets so upset... he now whispers the message to me so I can say it for
> the reply."
> Helen

Read a short [New York Times article](https://www.nytimes.com/2022/08/23/opinion/stutter-speech-listening.html)
or [watch a video](https://youtu.be/m0E_wMIwfSI) on stuttering and technology.

### Additional beneficiaries of accessibility

While the number of people with disabilities worldwide is large, it's important
to remember that these numbers aren't inclusive of everyone that benefits from
accessible digital spaces. This includes:

- *Temporarily disabled*. It may mean someone has a broken wrist or is cognitively impaired due to medication.
- *Situationally disabled*. For example, someone experiencing glare on a device screen or being unable to play the audio on a video in a public setting.
- *Mildly disabled*. A person needing eyeglasses to see a screen or captions to understand audio.
- *Non-native speakers*. If a person is not fluent in the language on the screen, they may need more time to read content on a slide on a carousel/slideshow.
- *Older people with age-related diminishing senses*. It could be a person needing reading glasses or bifocals to read small print or requiring a larger target size for buttons on their touch device due to an age-related hand tremor.
- *Search engine optimization (SEO) bots*. SEO bots do not have senses like sight and hearing and navigate by keyboard only. Your websites are crawled more effectively when your site is accessible.

## Business impact

People with disabilities make up almost a fourth of the world's population, but
did you know that they also have a lot of spending power?

According to the
[American Institutes for Research (AIR)](https://www.researchgate.net/profile/Dahlia-Shaewitz/publication/324603094_A_Hidden_Market_The_Purchasing_Power_of_Working-Age_Adults_With_Disabilities_A_Hidden_Market_The_Purchasing_Power_of_Working-Age_Adults_With_Disabilities/links/5ad89016458515c60f5918f3/A-Hidden-Market-The-Purchasing-Power-of-Working-Age-Adults-With-Disabilities-A-Hidden-Market-The-Purchasing-Power-of-Working-Age-Adults-With-Disabilities.pdf),
the total after-tax disposable income for working-age Americans with
disabilities is about $490 billion annually. This number is similar to other
significant market segments in the US, such as the Black ($501 billion) and
Latinx ($582 billion) communities. Companies that don't plan for, design, and
build accessible products can lose out on this potential revenue.

While these numbers are impressive, people with disabilities are also part of a
larger network of family members, friends, communities, and institutions. This
larger network often looks for and supports businesses that create accessible
digital products. When you factor in the friends and family of the over 1.3
billion people worldwide who identify as disabled, the disability market
touches 53% of all consumers. It's the world's largest emerging market.

In addition to money and market shares, businesses focused on disability
inclusion as part of an overall diversity strategy are [higher performing and
more innovative](https://www.w3.org/WAI/business-case/). There are many
examples of [everyday products](https://incl.ca/the-evolution-of-assistive-technology-into-everyday-products/)
that evolved from technology developed by, or for, people with disabilities,
including:

- Telephones
- Typewriters / keyboards
- Email
- Kitchen utensils
- Easy-open pull-out drawers
- Automatic door openers
- Voice controls
- Eye gaze technology

When we look at accessibility as a design or coding challenge, not a begrudging
requirement, innovation is the byproduct. For people without disabilities, such
improvements can increase the overall user experience. For people with
disabilities, these improvements are essential for equal access.

## Legal impact

Beyond the individual and business impact, you should also be aware of the
looming [legal impact](https://f.hubspotusercontent30.net/hubfs/3280432/Remediated-2021-Year-End-Report-FINAL.pdf)
of building inaccessible digital products. Public sector entities in the
United States, such as government-funded programs and schools, airlines, and
nonprofits, must follow certain digital accessibility rules, while many private
sector companies don't. In countries such as Canada, the United Kingdom,
Japan, Australia, and the European Union, stricter
[digital accessibility laws](https://www.w3.org/WAI/policies/) exist for both
public and private companies.

For many disabled people in the United States, filing a lawsuit is their only
option to bring awareness and change to digital products. It's estimated that,
in the US, over ten lawsuits are filed daily focused on digital accessibility.
Many businesses have received multiple digital accessibility-based lawsuits. And
every year, the number of total lawsuits has increased.

Ecommerce websites and apps are typically the biggest targets, comprising over
74% of the lawsuits filed in 2021. If your company has both a physical location
and an online presence, you are more likely to have been part of a lawsuit. In
fact, of the top 500 ecommerce sites, 412 have been served with a lawsuit
within the past four years. Often, the first lawsuit is for the company's
website and the second for their mobile app.

While avoiding lawsuits shouldn't be the only reason you focus on making sure
your digital products are accessible, it's an important piece of the
conversation.
