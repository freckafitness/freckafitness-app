const ANIMAL_FACTS = [
  // Sea otters
  'Sea otters hold hands while sleeping so they don\'t drift apart. The behavior is called "rafting," and mothers wrap pup in kelp as an anchor while they dive for food.',
  'Sea otters carry a personal favorite rock in a loose skin pouch under each armpit. They use it as an anvil to crack shellfish and have been observed keeping the same stone for years.',
  'Sea otter fur is the densest of any mammal — up to a million hairs per square inch. They have no blubber and rely entirely on trapped air in their coat for insulation.',

  // Crows & ravens
  'Crows recognize individual human faces, remember which ones have threatened them, and pass that information to their offspring. A grudge held by a crow can span generations.',
  'Crows in Tokyo drop hard nuts on pedestrian crossings, wait for cars to crack them, then retrieve the pieces on the walk signal. The behavior has been documented spreading through urban crow populations as social learning.',
  'Ravens play. They have been observed sliding repeatedly down snowy slopes for no apparent purpose, and in some studies appeared to deliberately prank other ravens.',
  'Ravens can plan for the future, barter with each other, and have been documented creating false food caches when they know another raven is watching — deliberately deceiving a competitor.',
  'Crows cache food and remember thousands of hiding spots. They also hide food differently when observed, sometimes staging fake caches as misdirection.',

  // Octopuses
  'Octopuses have three hearts. Two pump blood to the gills; one to the body. The body heart stops beating when they swim, which is part of why they prefer crawling.',
  'Octopus arms have semi-autonomous nervous systems. Each arm can taste, touch, and make simple local decisions without consulting the central brain.',
  'Mimic octopuses can impersonate flatfish, lionfish, and sea snakes — switching between different mimicry strategies based on which local predator they\'re trying to deter.',
  'Giant Pacific octopuses have been documented escaping their tanks at night, crossing the floor, entering adjacent tanks to eat fish, and returning before morning.',

  // Wombats
  'Wombat droppings are cube-shaped — the only known animal to produce cubic feces. The geometry is achieved through unique elastic intestinal muscles rather than any rigid anatomy.',
  'Wombats have backwards-facing pouches so they don\'t shovel dirt onto their young while digging. Their rear is also reinforced with thick cartilage, which they use to block their burrow entrance against predators.',

  // Capybaras
  'Capybaras are so universally calm that almost every other animal will simply sit on them. Birds, monkeys, rabbits, and small caimans have all been documented resting on capybaras in the wild.',
  'Capuchin monkeys have distinct regional "cultures" in tool use — including cracking nuts with stones — that don\'t reflect their genetic relationships, suggesting the techniques spread through social learning.',

  // Axolotls
  'Axolotls can regenerate entire limbs, parts of their heart, and portions of their brain with minimal scarring — a capability that has been studied by researchers for its implications in human medicine.',
  'Axolotls remain permanently in their larval aquatic form throughout their lives, a trait called paedomorphosis. Full metamorphosis can be artificially induced, but it dramatically shortens their lifespan.',

  // Mantis shrimp
  'Mantis shrimp can punch with an acceleration of 10,000g — fast enough that the water around the strike momentarily boils through cavitation. The shockwave can stun or kill prey even if the punch itself misses.',
  'Mantis shrimp have 12–16 types of color receptors compared to the human eye\'s three. They also see ultraviolet, infrared, and circularly polarized light, which they use in communication invisible to other species.',

  // Elephants
  'Elephants are the only non-human animals known to hold recognized mourning rituals — revisiting the bones of deceased family members for years and responding with visible behavioral changes.',
  'Elephants can distinguish between human languages and dialects. Studies in Kenya showed they responded differently to Maasai men (a historically associated threat) versus Kamba women, based on voice alone.',
  'Elephants communicate across miles using infrasound — frequencies below human hearing — transmitted through the ground. They detect these rumbles through their sensitive, padded feet.',

  // Dolphins
  'Dolphins develop unique signature whistles that function as individual names. Other dolphins use those specific whistles to call to individuals — not just to get any dolphin\'s attention, but that dolphin.',
  'Dolphins have been documented surfing ocean waves, chasing boats, and blowing bubble rings underwater — behaviors that serve no apparent survival function and appear to be play.',
  'Dolphins use marine sponges as tools to protect their snouts while foraging on rocky seabeds. Daughters learn the technique from their mothers, creating a cultural tradition that passes through the female line.',

  // Penguins
  'Male Adélie penguins propose with a carefully chosen pebble. Females evaluate the stone, and a good one is genuinely meaningful — pebbles are a scarce resource used to build nests, and some penguins steal them.',
  'Emperor penguins form rotating huddles in Antarctic winter, with the outer penguins slowly spiraling inward so no individual stays cold for long. The movement is coordinated without any apparent leader.',

  // Tardigrades
  'Tardigrades (water bears) can survive exposure to the vacuum of space, temperatures approaching absolute zero, and radiation doses that would be lethal to any other known animal. They do it by entering a state called cryptobiosis — effectively pausing all metabolism.',
  'Tardigrades are found on every continent including Antarctica, in hot springs, deep ocean sediment, and mountain glaciers. They were the first animal known to survive direct exposure to outer space.',

  // Platypus
  'The platypus is one of only a few venomous mammals. Males have ankle spurs capable of delivering venom potent enough to cause excruciating, long-lasting pain in humans — and the venom contains proteins found in no other known animal.',
  'Platypuses glow blue-green under UV light — a property discovered in 2020 when a researcher checked a museum specimen with a UV torch on a whim. The biological purpose is still unknown.',
  'Platypuses don\'t have stomachs. Food passes directly from the esophagus to the intestine, and the animal navigates underwater with its eyes and ears closed, using only the electroreception sensors in its bill.',

  // Red pandas
  'Red pandas use their bushy tails as blankets in cold weather and stand bipedally — raising themselves on their hind legs — when attempting to appear larger to a perceived threat.',
  'Red pandas have a false thumb: an extended wrist bone used to grip bamboo. The giant panda independently evolved the same structure — a remarkable case of convergent evolution solving the same problem.',

  // Quokkas
  'Quokkas on Rottnest Island have no natural predators and have no instinctive fear of humans, making them remarkably approachable. They are also capable of throwing their young from their pouches when fleeing a predator.',

  // Blobfish
  'Blobfish look like deflated balloons at the surface because they are — the "melted face" is entirely a decompression artifact. At their natural depth of around 900 meters, the pressure gives them an entirely normal fish shape.',

  // Naked mole rats
  'Naked mole rats appear not to age in any biologically conventional sense — individual workers show no measurable increase in mortality risk as they get older, an almost unique trait in vertebrates.',
  'Naked mole rats are eusocial mammals, living in colonies with a single breeding queen — a social structure otherwise known only in insects like ants and bees. Workers are functionally sterile unless the queen dies.',
  'Naked mole rats don\'t get cancer. Researchers have identified a specific molecular mechanism — overproduction of a sugar called hyaluronan — that triggers early cell death before tumors can form.',

  // Sloths
  'Sloths move so slowly that algae grows in their fur, giving them a greenish tint that acts as camouflage in the forest canopy. Some moth species complete their entire life cycle in sloth fur.',
  'Three-toed sloths have extra neck vertebrae that allow them to rotate their heads almost 270 degrees — a useful adaptation for an animal that spends most of its life hanging upside down.',

  // Honey badgers
  'Honey badger skin is so thick and loose that a honey badger grabbed from behind can rotate almost entirely inside its own skin to bite the attacker. Many predators simply give up.',
  'Honey badgers have been documented escaping from enclosed pens by using sticks as ladders, rolling rocks to stand on, and methodically trying new approaches after each failure — a problem-solving persistence usually associated only with primates.',

  // Kiwis
  'Kiwis are the only birds with nostrils at the tip of their beaks, and they locate earthworms primarily by smell rather than sight or hearing. Their eggs are proportionally the largest of any bird — up to 20% of the mother\'s body weight.',

  // Seahorses
  'Seahorses mate for life, greet each other every morning with a synchronized courtship dance, and the male carries and gives birth to the young — one of the only species where the male undergoes pregnancy.',

  // Hummingbirds
  'Hummingbirds enter a nightly state called torpor, dropping their heart rate from around 1,200 beats per minute to roughly 50 and their body temperature near ambient air temperature — a short hibernation to survive the night on stored energy.',
  'A hummingbird\'s brain makes up 4.2% of its body weight — the highest proportion of any bird. A significant portion is dedicated to memory, particularly spatial memory for flower locations.',

  // Pistol shrimp
  'Pistol shrimp snap their claws faster than a bullet, generating a cavitation bubble that briefly reaches temperatures around 8,000°F — hotter than the surface of the sun — to stun prey. The snap is loud enough to disrupt sonar.',
  'Pistol shrimp and gobies often live in symbiotic pairs. The nearly blind shrimp digs and maintains the shared burrow while the goby stands guard, twitching its tail to signal danger. These partnerships can last years.',

  // Flamingos
  'Flamingos are not pink at birth — their color comes entirely from carotenoid pigments in the algae and crustaceans they eat. In captivity without the right diet, they go white.',
  'Flamingos can only eat with their heads upside down. Their bills are specially adapted to filter food from water in that orientation, which is why they always appear to be eating in an awkward position.',

  // Cuttlefish
  'Cuttlefish can change both the color and physical texture of their skin in milliseconds. They are almost certainly colorblind and are thought to perceive polarized light instead — using it to see contrast that replaces color information.',
  'Cuttlefish flash hypnotic, rippling patterns at prey while slowly approaching — a behavior that appears to mesmerize crabs and small fish before capture.',

  // Pigs
  'Pigs have been shown in studies to understand mirrors, operate simple joystick-controlled video games with their snouts, and demonstrate empathy for other pigs in distress.',
  'Pigs learn their names within about two weeks of birth and can outperform dogs on certain spatial memory and problem-solving tasks — findings that consistently surprise researchers unfamiliar with pig cognition.',

  // Honey bees
  'Honey bees make decisions democratically. When scouting for a new hive location, scouts perform waggle dances for their preferred site and "debate" — with enthusiasm measured by dance intensity — until consensus is reached.',
  'A single honeybee produces about one-twelfth of a teaspoon of honey in its entire lifetime. The colony as a whole visits around two million flowers to produce one pound.',

  // Electric eels
  'Electric eels can produce a 600-volt discharge, and have been documented leaping partially out of the water to deliver stronger shocks directly to the bodies of larger threats — a behavior that was only formally described in scientific literature in 2016.',

  // Bowerbirds
  'Bowerbirds collect blue objects to decorate their bowers and arrange them deliberately by size — with the smallest objects closest to the entrance. This creates an optical illusion that makes the bower appear larger to a female looking in from the front.',

  // Dogs
  'Dogs process human speech using the same brain hemisphere organization as humans — right hemisphere for emotional tone, left for word meaning. This arrangement evolved convergently; it isn\'t something dogs inherited from a shared ancestor with us.',
  'Dogs can detect certain cancers by smell with accuracy rates comparable to clinical screening tools. They have also been shown in controlled trials to alert diabetics to blood sugar changes before the person is consciously aware of them.',

  // African grey parrots
  'African grey parrots have demonstrated an understanding of the concept of zero — recognizing that "none" is less than one. They can also voluntarily delay gratification, performing at levels comparable to 5-year-old children in some tests.',

  // Monarch butterflies
  'Monarch butterflies navigate using a time-compensated sun compass that adjusts its readings based on the time of day, and they carry a magnetic compass as a backup. Their annual migration of up to 3,000 miles is completed without any individual having made the journey before.',

  // Prairie dogs
  'Prairie dogs have one of the most complex known animal communication systems. A single call can encode a predator\'s species, size, color, and speed of approach — and they produce different calls for humans in different colored shirts.',

  // Orcas
  'Orca pods have distinct dialects, unique hunting techniques, and cultural traditions passed across generations — differences so consistent that researchers can identify which pod a recording came from by its calls alone.',

  // Migratory birds
  'Migratory birds may navigate by literally seeing Earth\'s magnetic field. Specialized proteins called cryptochromes in their eyes are thought to create a faint visual overlay of magnetic field lines — essentially a compass that appears in their vision.',

  // Chimpanzees & bonobos
  'Chimpanzees mourn their dead, and orphaned chimps have been documented carrying the mummified bodies of deceased mothers for weeks or months before setting them down.',
  'Bonobos — our other closest living relative alongside chimps — resolve almost all social conflict through affiliative behavior rather than aggression, and female coalitions hold the dominant social positions in every bonobo group studied.',

  // Meerkats
  'Meerkats run a structured teaching program. Experienced adults bring slightly injured prey for juveniles to practice killing, progressively introducing live prey as skill improves. Deliberate, graduated teaching of this kind is rare even among primates.',

  // Macaques
  'Macaques in Koshima, Japan were documented washing sweet potatoes — and dunking them in the ocean to salt them — after a single juvenile named Imo invented the behavior in 1953. The practice spread through the group and is still observed today.',

  // Coconut crabs
  'Coconut crabs are the largest land invertebrates on Earth. They can crack open coconuts with their claws, climb trees to drop them, and live for over 60 years. They have been documented dismantling seabirds and are strong enough to lift objects up to their own body weight.',

  // Humpback whales
  'Humpback whale songs evolve over time: a new phrase coined by one whale spreads to others, eventually replacing the old version across entire ocean populations within a few years — cultural transmission on a vast, slow scale.',

  // Wolverines
  'Wolverines punch so far above their weight class that they have been documented stealing kills from wolves, driving off cougars from their prey, and traveling up to 15 miles a day through deep snow in search of food.',

  // Starlings
  'Starling murmurations — those coordinated, shape-shifting aerial displays involving thousands of birds — emerge from each bird following the movements of its nearest seven neighbors. No individual leads; the pattern is purely emergent.',

  // Manta rays
  'Manta rays visit specific reef locations called cleaning stations, where smaller fish remove parasites and dead skin. Individual rays have been observed returning to the same stations for years, and sometimes appear to queue.',

  // Mountain goats
  'Mountain goats scale near-vertical cliff faces using hooves with hard outer edges for grip and soft inner pads that work like suction cups. They can jump 12 feet horizontally between rock faces and are effectively immune to most predators simply through terrain.',

  // Insects
  'Dragonflies have a 95% hunting success rate — the highest of any predator studied. They don\'t chase prey; they intercept it by predicting its trajectory. A specialized neural circuit locks onto a moving target and steers the dragonfly to where the prey will be, not where it is.',
  'Dung beetles navigate by the Milky Way — the first insects known to use the galaxy as a compass. They roll their ball in a straight line at night by orienting to the band of stars overhead, confirmed by researchers who tested them under a planetarium sky.',
  'Leafcutter ants have been farming fungus for approximately 50 million years — the oldest known agricultural system on Earth. They cultivate a single fungal species that no longer exists in the wild, existing only in their colonies.',
  'Fireflies produce light with nearly 100% efficiency — almost no energy is lost as heat. Biochemists have used the same bioluminescence chemistry (luciferin and luciferase) to detect cancer cells, bacterial infections, and contamination in food safety testing.',

  // Reptiles
  'Chameleons don\'t change color to blend in — they change color primarily to communicate mood, temperature, and dominance. Their skin contains layers of iridophore cells with structural crystals that reflect different wavelengths of light depending on how far apart the crystals are spaced.',
  'Komodo dragons have venom glands that prevent blood from clotting. For decades, scientists believed they killed through bacteria alone. The venom was only discovered in 2009, when researchers examined the gland structure under anesthesia.',
  'Geckos walk on ceilings through van der Waals forces — not suction. Each toe has millions of microscopic hair-like structures called setae that create intermolecular adhesion between the gecko and the surface. The grip is dry, self-cleaning, and can be switched off instantly by changing the angle of the toes.',
  'The tuatara of New Zealand is the sole surviving member of an order that was widespread 200 million years ago. It has a photosensitive third eye on top of its head (visible in juveniles), continues growing until age 35, and can live past 100 years.',
  'Sea turtles navigate thousands of miles of open ocean to return to the exact beach where they hatched — often within meters of their birth site. They do it using Earth\'s magnetic field as a map, imprinting on the unique magnetic signature of their natal beach as hatchlings.',

  // Dinosaurs
  'Velociraptor was roughly the size of a turkey. The human-sized version in Jurassic Park was modeled more accurately on Deinonychus — a close relative. The filmmakers kept "Velociraptor" because it sounded better.',
  'T. rex had the most powerful bite ever measured in a land animal — estimated at around 8,000 lbs of force, enough to crush bone. It actively ate bone for the marrow, and fossilized T. rex droppings (coprolites) contain crushed bone fragments that confirm it.',
  'Sauropod dinosaurs had a respiratory system nearly identical to modern birds — a network of air sacs extending through their bones and body cavities. This is one of the strongest pieces of evidence linking dinosaurs directly to living birds.',
  'T. rex and Stegosaurus never coexisted. Stegosaurus went extinct about 80 million years before T. rex appeared — meaning T. rex is chronologically closer to humans today than it ever was to Stegosaurus.',
  'Some dinosaurs brooded their eggs like modern birds. A fossil of an Oviraptor was found in a brooding posture directly over its nest — initially thought to be a thief raiding another\'s eggs, which is how it got its name ("egg thief"). Later evidence confirmed it was protecting its own clutch.',
  'Spinosaurus was larger than T. rex and is now believed to have been primarily aquatic. It had dense, hippo-like bones for buoyancy control, short rear legs suited to swimming, and nostrils positioned well back on its skull to breathe while mostly submerged.',

  // More quirky animals
  'Narwhals\' spiraling "horn" is actually a tooth — a modified canine that grows through the upper lip. It contains up to 10 million nerve endings and is thought to function as a sensory organ, detecting changes in water pressure, temperature, and salinity.',
  'Manatees are closely related to elephants, sharing a common ancestor around 60 million years ago. One of the clearest holdovers: manatees have small toenails on their flippers, in roughly the same position as elephant toenails.',
  'Beluga whales are the only whales that can turn their heads sideways — all other whales have fused cervical vertebrae. They can also change the shape of their forehead (the melon) at will, which plays a role in echolocation and appears to be used in social communication.',
  'The binturong — a bearcat from Southeast Asia — smells exactly like buttered popcorn. The scent comes from 2-acetyl-1-pyrroline in its urine, the same chemical compound responsible for the smell of popcorn and fresh bread crust.',
  'Jumping spiders have better vision relative to their size than most mammals. They plan routes around obstacles they cannot see yet, and have been shown in lab trials to navigate detours requiring them to move temporarily away from a visible target to reach it. They also appear to look at things with what researchers describe as curiosity.',
  'The orchid mantis mimics an orchid flower so convincingly that pollinators approach it seeking nectar. Unlike most mimics that use camouflage to hide, the orchid mantis uses it offensively — the mimicry lures prey directly to the predator.',
  'Star-nosed moles have 22 pink tentacles surrounding their nose, each packed with sensory nerve endings — more nerve fibers per square millimeter than any other known touch organ. They are the fastest-eating mammal on Earth, able to identify, capture, and swallow prey in under 120 milliseconds.',
  'Lyrebirds can mimic chainsaws, camera shutters, car alarms, construction equipment, and other bird species with extraordinary precision. Males build up a repertoire over years and incorporate it into their courtship displays — some songs in wild populations include sounds from logging that occurred decades ago.',
  'Kakapos are the world\'s heaviest parrots and the only flightless ones. Critically endangered and nocturnal, they excavate bowl-shaped depressions on hilltops that act as natural amplifiers, then fill the night with a booming call audible up to 5 kilometers away — and wait.',
  'Hedgehogs are largely immune to snake venom and can survive bites that would be lethal to similarly sized animals. During hibernation, their heart rate drops from around 190 beats per minute to roughly 20, and they shiver intensely upon waking to generate enough heat to restart normal metabolism.',
  'Mountain gorillas have individual nose prints as unique as human fingerprints. Researchers use photographs of their nose ridges to identify individuals in the field — a method reliable enough to track specific gorillas across decades of observation.',
  'Superb fairywren mothers sing a specific "password" call to their eggs before they hatch. Chicks that reproduce the call correctly receive more food. Researchers believe this evolved as a countermeasure against cuckoo parasites, which can\'t learn the call in time.',
];

const STORAGE_KEY = 'ff_animal_idx';

export function getNextAnimalFact() {
  const stored = localStorage.getItem(STORAGE_KEY);
  let idx;
  if (stored === null) {
    idx = Math.floor(Math.random() * ANIMAL_FACTS.length);
  } else {
    idx = (parseInt(stored, 10) + 1) % ANIMAL_FACTS.length;
  }
  localStorage.setItem(STORAGE_KEY, String(idx));
  return ANIMAL_FACTS[idx];
}
