export const frameworks = [
  {
    id: 'ns-prefix',
    question: 'What does the "NS" prefix in NSObject and NSString stand for?',
    answer: 'NeXTSTEP',
    detail: 'Cocoa descends from the NeXTSTEP frameworks Apple got with NeXT.',
  },
  {
    id: 'objc-creators',
    question: 'Brad Cox and Tom Love created which programming language in the early 1980s?',
    answer: 'Objective-C',
    detail: 'NeXT licensed it in 1988 and built NeXTSTEP with it.',
  },
  {
    id: 'objc-categories',
    question: 'In Objective-C, what do you call a way to add methods to an existing class without subclassing it?',
    answer: 'A category',
    detail: 'Swift\'s equivalent is an extension.',
  },
  {
    id: 'cg-prefix',
    question: 'What does the "CG" prefix in CGRect and CGFloat stand for?',
    answer: 'Core Graphics',
  },
  {
    id: 'ib-prefix',
    question: 'In @IBOutlet and @IBAction, what does "IB" stand for?',
    answer: 'Interface Builder',
  },
  {
    id: 'kvo',
    question: 'What does KVO stand for?',
    answer: 'Key-Value Observing',
  },
  {
    id: 'gcd',
    question: 'What does GCD stand for?',
    answer: 'Grand Central Dispatch',
    detail: 'It arrived in Mac OS X 10.6 Snow Leopard in 2009.',
  },
  {
    id: 'arc',
    question: 'What memory model, introduced in 2011, replaced manual retain and release?',
    answer: 'ARC (Automatic Reference Counting)',
    detail: 'It shipped with Xcode 4.2 and iOS 5.',
  },
  {
    id: 'view-did-load',
    question: 'Which UIViewController method is called after its view has loaded into memory?',
    answer: 'viewDidLoad()',
  },
  {
    id: 'table-view',
    question: 'Which UIKit class shows a scrolling, single-column list of rows?',
    answer: 'UITableView',
  },
  {
    id: 'auto-layout',
    question: 'What is the constraint-based layout system that arrived in OS X Lion and iOS 6?',
    answer: 'Auto Layout',
  },
  {
    id: 'layer-kit',
    question: 'Core Animation was known by what name inside the early iPhone project?',
    answer: 'LayerKit',
  },
  {
    id: 'ui-scene',
    question: 'Which class did iOS 13 add so one app could show multiple windows on iPad?',
    answer: 'UIScene (UIWindowScene)',
    detail: 'It came with a new scene delegate alongside the app delegate.',
  },
  {
    id: 'metal',
    question: 'Which low-level GPU framework, introduced in 2014, replaced OpenGL on Apple platforms?',
    answer: 'Metal',
  },
  {
    id: 'swiftui-year',
    question: 'At which WWDC was SwiftUI introduced?',
    answer: 'WWDC 2019',
  },
  {
    id: 'combine',
    question: 'What is the name of Apple\'s reactive framework for streams of values over time, introduced in 2019?',
    answer: 'Combine',
  },
  {
    id: 'swift-state',
    question: 'Which SwiftUI property wrapper holds a value that a view owns and changes?',
    answer: '@State',
  },
  {
    id: 'observable',
    question: 'In iOS 17, which macro replaced ObservableObject and @Published for most SwiftUI models?',
    answer: '@Observable',
    detail: 'It comes from the Observation framework.',
  },
  {
    id: 'swiftdata',
    question: 'Which Swift-native persistence framework, introduced in 2023, is built on Core Data?',
    answer: 'SwiftData',
  },
  {
    id: 'info-plist',
    question: 'Which file declares an app\'s bundle identifier, version, and privacy usage strings?',
    answer: 'Info.plist',
  },
];
