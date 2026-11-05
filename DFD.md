# Rabona Data Flow Diagram

## 1. Context Diagram

```mermaid
flowchart LR
    Player[Player]
    Coach[Coach]
    Visitor[Authenticated Visitor]
    AcademyOwner[Academy Owner or Admin]
    Google[Google Identity Provider]
    App[Rabona Web Application]
    Firebase[Firebase Platform]

    Player -->|signup, posts, likes, comments, bookings| App
    Coach -->|signup, coach profile, posts| App
    Visitor -->|browse feed, academies, profiles, store| App
    AcademyOwner -->|academy page data and plans| App
    App -->|Google sign-in| Google
    App -->|read and write validated data| Firebase
    Firebase -->|auth state, documents, media URLs| App
```

## 2. Level 1 Data Flow

```mermaid
flowchart TB
    U[User]
    A[React SPA]
    AUTH[Firebase Authentication]
    USERS[(users)]
    PLAYERS[(players)]
    COACHES[(coaches)]
    POSTS[(posts)]
    STORIES[(stories)]
    ACADEMIES[(academies)]
    BOOKINGS[(bookings)]
    ORDERS[(orders)]
    NOTIFICATIONS[(notifications)]
    STORAGE[(Firebase Storage)]
    CACHE[(Browser Local Storage)]

    U -->|login or signup| A
    A -->|Google popup| AUTH
    AUTH -->|uid and auth state| A

    A -->|create or update base profile| USERS
    A -->|player details| PLAYERS
    A -->|coach details| COACHES

    U -->|text, images, score| A
    A -->|compressed post images| STORAGE
    STORAGE -->|download URLs| A
    A -->|post document| POSTS
    A -->|feed updates| CACHE

    U -->|story image| A
    A -->|story media| STORAGE
    A -->|story document| STORIES

    U -->|search, filter, open page| A
    A -->|public academy query| ACADEMIES
    ACADEMIES -->|page data, cover, logo, plans| A
    A -->|academy cache| CACHE

    U -->|select plan and subscribe| A
    A -->|booking record| BOOKINGS
    A -->|academy reference| ACADEMIES

    U -->|cart and checkout| A
    A -->|order record| ORDERS

    A -->|notifications and read state| NOTIFICATIONS
```

## 3. Registration Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Signup as SignupPage
    participant Google as Firebase Auth
    participant AuthContext
    participant Firestore as Cloud Firestore

    User->>Signup: Choose Player or Coach
    Signup->>Google: Sign in with Google
    Google-->>AuthContext: Authenticated user and uid
    User->>Signup: Complete role-specific wizard
    Signup->>AuthContext: registerProfile(role, details)
    AuthContext->>Firestore: Write users/{uid}
    alt Player
        AuthContext->>Firestore: Write players/{uid}
    else Coach
        AuthContext->>Firestore: Write coaches/{uid}
    end
    Firestore-->>AuthContext: Stored profile
    AuthContext-->>Signup: Refresh profile
    Signup-->>User: Completed profile screen
```

## 4. Post and Upload Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Composer as NewPostPage
    participant Storage as Firebase Storage
    participant Posts as Firestore posts
    participant Feed as HomeFeed

    User->>Composer: Enter text and select up to 4 images
    Composer->>Composer: Validate and compress images
    loop Each selected image
        Composer->>Storage: Upload posts/{uid}/{postId}/{imageId}.webp
        Storage-->>Composer: Download URL
    end
    Composer->>Posts: Create post with text, URLs, audience, score
    Posts-->>Feed: Public feed snapshot
    Composer->>Feed: Dispatch local cache update
    Feed-->>User: Render new post immediately
```

## 5. Academy Page and Subscription Flow

```mermaid
flowchart LR
    User[Player or Visitor]
    List[AcademiesPage]
    Page[AcademyDetailPage]
    Academy[(academies)]
    Booking[(bookings)]
    Cache[(rabona_academies cache)]
    Admin[Academy Owner or Admin]

    Admin -->|create/update page data| Academy
    Academy -->|public query| List
    List -->|cache latest list| Cache
    Cache -->|fast initial render| List
    User -->|search and filter| List
    User -->|open academy page| Page
    Page -->|read page, plans, location| Academy
    User -->|choose plan| Page
    Page -->|create subscription/booking| Booking
```

## 6. Core Data Stores

| Store | Contents | Access pattern |
| --- | --- | --- |
| `users` | shared identity, role, profile media, bio | authenticated read; owner/admin write |
| `players` | football identity and location | authenticated read; owner write |
| `coaches` | coaching profile, specialties, plans | authenticated read; owner write |
| `academies` | public academy pages, plans, capacity, ratings | public read; owner/admin write |
| `posts` | feed posts, media URLs, reactions counters | public read; authenticated owner/action writes |
| `stories` | temporary user stories and expiry | public read; owner write |
| `bookings` | player subscriptions and academy bookings | owner/admin access |
| `orders` | store checkout records | user/admin access |
| `notifications` | user alerts and read state | recipient/admin access |
| Firebase Storage | uploaded post, story, profile, cover media | URL-based media retrieval with storage rules |
| Browser Local Storage | cached profile, academies, instant feed entries | local browser only |

## 7. Important Rules

- The browser is a client, not the authorization layer.
- Firestore and Storage rules must validate ownership and allowed fields.
- Signup exposes only `player` and `coach` choices.
- Academy records remain first-class public pages and can be read independently of signup.
- Uploaded media should be compressed before upload where the feature supports it.
