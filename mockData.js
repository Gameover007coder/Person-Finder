// mockData.js - SocialFinder OSINT Target Database

export const preConfiguredTargets = [
  {
    id: "target_alex",
    name: "Alex Rivera (Linus Torvalds)",
    bio: "Specialist in kernel development, low-level OS structures, and version control. Legend in distributed systems. Operates out of Portland/Tokyo. Threat profile: Alpha.",
    imagePath: "assets/alex.jpg",
    age: 56,
    mood: "Pragmatic",
    headPose: "Yaw: +5.2°, Pitch: -1.8°, Roll: +0.4°",
    eyeDistance: "84px",
    socials: {
      github: "torvalds"
    },
    // Facial bounding box relative percentages (x, y, width, height)
    faceBox: { x: 30, y: 15, w: 40, h: 48 },
    // Landmark points relative to the bounding box
    landmarks: [
      { x: 35, y: 35, type: "left-eye" },
      { x: 65, y: 35, type: "right-eye" },
      { x: 50, y: 55, type: "nose-tip" },
      { x: 40, y: 75, type: "mouth-left" },
      { x: 60, y: 75, type: "mouth-right" },
      { x: 50, y: 80, type: "chin" },
      // Left eye brow
      { x: 25, y: 28, type: "left-brow-1" },
      { x: 35, y: 25, type: "left-brow-2" },
      { x: 45, y: 28, type: "left-brow-3" },
      // Right eye brow
      { x: 55, y: 28, type: "right-brow-1" },
      { x: 65, y: 25, type: "right-brow-2" },
      { x: 75, y: 28, type: "right-brow-3" },
      // Face jawline outline
      { x: 15, y: 40, type: "jaw-1" },
      { x: 20, y: 60, type: "jaw-2" },
      { x: 30, y: 80, type: "jaw-3" },
      { x: 70, y: 80, type: "jaw-4" },
      { x: 79, y: 60, type: "jaw-5" },
      { x: 84, y: 40, type: "jaw-6" }
    ],
    // Geo-tracking movement history
    locations: [
      {
        lat: 35.658034,
        lng: 139.701636,
        name: "Shibuya Crossing Cyber Café",
        desc: "Simulated IP login on secure server. Connection lasted 42 mins. Telemetry matches kernel branch push.",
        time: "3 hours ago"
      },
      {
        lat: 35.660144,
        lng: 139.729220,
        name: "Roppongi Hills Guest Wi-Fi Node",
        desc: "Automated device MAC address match. Gateway log verified. Bandwidth usage spikes detected.",
        time: "2 hours ago"
      },
      {
        lat: 35.689487,
        lng: 139.691706,
        name: "Tokyo Metropolitan ATM Terminal #12",
        desc: "Encrypted transaction registered on regional ledger. ATM physical log correlates target footprint.",
        time: "45 mins ago"
      },
      {
        lat: 35.676399,
        lng: 139.699347,
        name: "Meiji Shrine Park Perimeter Node",
        desc: "Last registered cell tower tower ping - LTE Sector 9. Active device telemetry terminated.",
        time: "Last Seen"
      }
    ],
    posts: [] // Will be populated dynamically from GitHub Events API
  },
  {
    id: "target_elena",
    name: "Elena Rostova (Dan Abramov)",
    bio: "Systems architect, data structures specialist, and functional reactive state advocate. Operates out of London, UK. Threat profile: Active.",
    imagePath: "assets/elena.jpg",
    age: 33,
    mood: "Inquisitive",
    headPose: "Yaw: -2.1°, Pitch: +4.2°, Roll: -0.8°",
    eyeDistance: "92px",
    socials: {
      github: "gaearon"
    },
    faceBox: { x: 28, y: 18, w: 42, h: 46 },
    landmarks: [
      { x: 34, y: 36, type: "left-eye" },
      { x: 66, y: 36, type: "right-eye" },
      { x: 50, y: 53, type: "nose-tip" },
      { x: 38, y: 73, type: "mouth-left" },
      { x: 62, y: 73, type: "mouth-right" },
      { x: 50, y: 81, type: "chin" },
      // Left eye brow
      { x: 24, y: 29, type: "left-brow-1" },
      { x: 34, y: 26, type: "left-brow-2" },
      { x: 44, y: 29, type: "left-brow-3" },
      // Right eye brow
      { x: 56, y: 29, type: "right-brow-1" },
      { x: 66, y: 26, type: "right-brow-2" },
      { x: 76, y: 29, type: "right-brow-3" },
      // Face jawline outline
      { x: 16, y: 41, type: "jaw-1" },
      { x: 21, y: 61, type: "jaw-2" },
      { x: 31, y: 79, type: "jaw-3" },
      { x: 69, y: 79, type: "jaw-4" },
      { x: 79, y: 61, type: "jaw-5" },
      { x: 84, y: 41, type: "jaw-6" }
    ],
    locations: [
      {
        lat: 51.5074,
        lng: -0.1278,
        name: "Trafalgar Square Public Node",
        desc: "Target logged into encrypted VPN gateway. Device signature matches registered hardware.",
        time: "5 hours ago"
      },
      {
        lat: 51.5246,
        lng: -0.1340,
        name: "British Library Reading Room",
        desc: "RFID credential scan at entrance gate. Metadata query triggered by research database connection.",
        time: "3 hours ago"
      },
      {
        lat: 51.5153,
        lng: -0.0768,
        name: "Shoreditch Cyber-Bar & VR Lounge",
        desc: "Public Wi-Fi packet analysis captures routing logs. Geotag matches server sync telemetry.",
        time: "1 hour ago"
      },
      {
        lat: 51.5033,
        lng: -0.1195,
        name: "London Eye Transit Hub",
        desc: "CCTV facial recognition scan match. 94.2% biometric match score. Target moving northbound.",
        time: "Last Seen"
      }
    ],
    posts: [] // Will be populated dynamically from GitHub Events API
  },
  {
    id: "target_sarah",
    name: "Sarah Chen (Evan You)",
    bio: "Senior infrastructure developer, frontend compiler designer, and toolchain architect. Specializes in low-latency bundlers. Operates out of San Francisco, CA.",
    imagePath: "assets/sarah.jpg",
    age: 38,
    mood: "Analytical",
    headPose: "Yaw: +1.1°, Pitch: -0.5°, Roll: -0.2°",
    eyeDistance: "87px",
    socials: {
      github: "yyx990803"
    },
    faceBox: { x: 31, y: 16, w: 38, h: 44 },
    landmarks: [
      { x: 36, y: 35, type: "left-eye" },
      { x: 64, y: 35, type: "right-eye" },
      { x: 50, y: 54, type: "nose-tip" },
      { x: 39, y: 74, type: "mouth-left" },
      { x: 61, y: 74, type: "mouth-right" },
      { x: 50, y: 81, type: "chin" },
      // Left eye brow
      { x: 25, y: 28, type: "left-brow-1" },
      { x: 35, y: 25, type: "left-brow-2" },
      { x: 45, y: 28, type: "left-brow-3" },
      // Right eye brow
      { x: 55, y: 28, type: "right-brow-1" },
      { x: 65, y: 25, type: "right-brow-2" },
      { x: 75, y: 28, type: "right-brow-3" },
      // Face jawline outline
      { x: 17, y: 40, type: "jaw-1" },
      { x: 22, y: 60, type: "jaw-2" },
      { x: 32, y: 79, type: "jaw-3" },
      { x: 68, y: 79, type: "jaw-4" },
      { x: 78, y: 60, type: "jaw-5" },
      { x: 83, y: 40, type: "jaw-6" }
    ],
    locations: [
      {
        lat: 37.774929,
        lng: -122.419416,
        name: "San Francisco Civic Center Node",
        desc: "Target logged into VPN server using multi-factor biometric key. Location confirmed.",
        time: "6 hours ago"
      },
      {
        lat: 37.789172,
        lng: -122.401447,
        name: "Financial District Server Room",
        desc: "Badge access scan at critical data center room A. Time correlated with backup sync execution.",
        time: "4 hours ago"
      },
      {
        lat: 37.808673,
        lng: -122.409821,
        name: "Fisherman's Wharf Coffee Hub",
        desc: "Public network beacon captures device handshake. Coordinates match git repo clone activity.",
        time: "2 hours ago"
      },
      {
        lat: 37.8024,
        lng: -122.4058,
        name: "Telegraph Hill Telecom Tower",
        desc: "Active GSM triangulation pings. Signal strength confirms target altitude at Coit Tower site.",
        time: "Last Seen"
      }
    ],
    posts: [] // Will be populated dynamically from GitHub Events API
  }
];
