const fs = require('fs');
const path = require('path');

const uiManagerFile = path.join(
  __dirname, '..', 'node_modules', 'expo-modules-core',
  'android', 'src', 'main', 'java', 'expo', 'modules', 'core',
  'interfaces', 'services', 'UIManager.java'
);

const uiManagerWrapperFile = path.join(
  __dirname, '..', 'node_modules', 'expo-modules-core',
  'android', 'src', 'main', 'java', 'expo', 'modules',
  'adapters', 'react', 'services', 'UIManagerModuleWrapper.java'
);

const fullscreenVideoPlayerFile = path.join(
  __dirname, '..', 'node_modules', 'expo-av',
  'android', 'src', 'main', 'java', 'expo', 'modules', 'av',
  'video', 'FullscreenVideoPlayer.java'
);

// Patch 1: Add resolveView to UIManager interface
let content = fs.readFileSync(uiManagerFile, 'utf8');
if (!content.includes('resolveView')) {
  content = content.replace(
    'import expo.modules.core.interfaces.ActivityEventListener;',
    'import android.view.View;\n\nimport expo.modules.core.interfaces.ActivityEventListener;'
  );
  content = content.replace(
    'void unregisterActivityEventListener(ActivityEventListener activityEventListener);',
    `void unregisterActivityEventListener(ActivityEventListener activityEventListener);\n\n  View resolveView(int viewTag);`
  );
  fs.writeFileSync(uiManagerFile, content);
  console.log('Patched UIManager.java');
} else {
  console.log('UIManager.java already patched');
}

// Patch 2: Implement resolveView in UIManagerModuleWrapper
content = fs.readFileSync(uiManagerWrapperFile, 'utf8');
if (!content.includes('resolveView')) {
  content = content.replace(
    'import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;',
    `import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.common.UIManagerType;`
  );
  content = content.replace(
    'import android.app.Activity;',
    'import android.app.Activity;\nimport android.view.View;'
  );
  content = content.replace(
    '  @Override\n  public void unregisterActivityEventListener(final ActivityEventListener activityEventListener) {',
    `  @Override
  public View resolveView(int viewTag) {
    return UIManagerHelper
      .getUIManagerForReactTag(mReactContext, viewTag)
      .resolveView(viewTag);
  }

  @Override
  public void unregisterActivityEventListener(final ActivityEventListener activityEventListener) {`
  );
  fs.writeFileSync(uiManagerWrapperFile, content);
  console.log('Patched UIManagerModuleWrapper.java');
} else {
  console.log('UIManagerModuleWrapper.java already patched');
}

// Patch 3: Fix FullscreenVideoPlayer.java - KeepAwakeManager was removed in SDK 57
content = fs.readFileSync(fullscreenVideoPlayerFile, 'utf8');
if (!content.includes('// patched: removed KeepAwakeManager')) {
  // Remove KeepAwakeManager import (removed from expo-modules-core in SDK 57)
  content = content.replace(
    "import expo.modules.core.interfaces.services.KeepAwakeManager;\n",
    ""
  );
  // Remove unused ModuleRegistry import since KeepAwakeManager was the only usage
  content = content.replace(
    "import expo.modules.core.ModuleRegistry;\n",
    ""
  );
  // Remove KeepAwakeManager usage - both branches did addFlags(FLAG_KEEP_SCREEN_ON) anyway
  content = content.replace(
    `          AppContext appContext = fullscreenVideoPlayer.mAppContext.get();
          ModuleRegistry moduleRegistry = appContext != null ? appContext.getLegacyModuleRegistry() : null;
          if (moduleRegistry != null) {
            KeepAwakeManager keepAwakeManager = moduleRegistry.getModule(KeepAwakeManager.class);
            boolean keepAwakeIsActivated = keepAwakeManager != null && keepAwakeManager.isActivated();
            if (isPlaying || keepAwakeIsActivated) {
              window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            } else {
              window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            }
          }`,
    `          if (isPlaying) {
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
          }`
  );
  fs.writeFileSync(fullscreenVideoPlayerFile, content);
  console.log('Patched FullscreenVideoPlayer.java');
} else {
  console.log('FullscreenVideoPlayer.java already patched');
}
