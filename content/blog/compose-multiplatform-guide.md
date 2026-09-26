---
title: "Getting Started with Compose Multiplatform for Android & Desktop"
slug: "compose-multiplatform-guide"
description: "Learn how to share UI logic across Android, iOS, and Desktop platforms using Jetpack Compose and Kotlin Multiplatform."
date: "2026-03-05"
updatedAt: "2026-03-05"
author: "Mohammad Asif Zafar"
category: "Compose Multiplatform"
tags:
  - Compose
  - KMP
  - Multiplatform
  - UI
coverImage: "images/blog/compose-multiplatform.svg"
published: true
---

# Getting Started with Compose Multiplatform for Android & Desktop

Kotlin Multiplatform (KMP) has already established itself as an industry leader for sharing business logic, networking, and persistence across target platforms. Now, **Compose Multiplatform** extends that capability to declaration-based UI across Android, iOS, Desktop (JVM), and Web.

In this guide, we will walk through setting up a shared Compose UI component across Android and Desktop applications.

---

## Why Compose Multiplatform?

Traditional cross-platform frameworks often rely on webviews or custom rendering abstractions that drift from native performance. Compose Multiplatform compiles directly to native canvas renderers (Skia/Skiko), delivering native 60fps rendering speed while allowing **100% UI component reuse**.

### Architecting a Shared UI Module

```text
shared/
  commonMain/
    kotlin/
      ui/
        components/
          AccountCard.kt
        screens/
          DashboardScreen.kt
```

---

## Creating Your First Shared Component

Here is a responsive Account Summary card built with shared Jetpack Compose code:

```kotlin
@Composable
fun AccountSummaryCard(
    accountName: String,
    balanceFormatted: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Text(
                text = accountName,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = balanceFormatted,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
```

---

## Platform Specific Adaptations with expect/actual

When you need platform-specific tweaks (such as native haptics or system dialogs), use Kotlin's powerful `expect`/`actual` declarations.

```kotlin
// commonMain
expect fun getPlatformName(): String

// androidMain
actual fun getPlatformName(): String = "Android ${android.os.Build.VERSION.RELEASE}"

// desktopMain
actual fun getPlatformName(): String = "Desktop (${System.getProperty("os.name")})"
```

---

## Conclusion

Compose Multiplatform significantly accelerates development velocity while preserving high UI fidelity and smooth performance across desktop and mobile devices.
