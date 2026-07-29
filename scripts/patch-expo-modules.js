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
    'public void unregisterActivityEventListener(final ActivityEventListener activityEventListener) {',
    `@Override
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
