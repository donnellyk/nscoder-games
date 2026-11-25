export const swift = [
  {
    id: 'swift-announced',
    question: 'At which WWDC was Swift announced?',
    answer: 'WWDC 2014',
    detail: 'It first shipped with Xcode 6 that fall.',
  },
  {
    id: 'swift-creator',
    question: 'Who started work on Swift at Apple in 2010?',
    answer: 'Chris Lattner',
    detail: 'He also created LLVM.',
  },
  {
    id: 'swift-open-source',
    question: 'In what year was Swift released as open source?',
    answer: '2015',
    detail: 'It went up on GitHub on December 3, 2015, along with swift.org.',
  },
  {
    id: 'abi-stability',
    question: 'Which Swift version brought ABI stability on Apple platforms?',
    answer: 'Swift 5.0',
    detail: 'Since 2019, apps no longer bundle their own copy of the Swift runtime.',
  },
  {
    id: 'swift-evolution-prefix',
    question: 'Proposals to change the Swift language are numbered with what prefix?',
    answer: 'SE (as in SE-0001)',
    detail: 'SE stands for Swift Evolution.',
  },
  {
    id: 'default-access',
    question: 'What is Swift\'s default access level when you write none?',
    answer: 'internal',
  },
  {
    id: 'mutating',
    question: 'What keyword must a struct method have to change the struct\'s own properties?',
    answer: 'mutating',
  },
  {
    id: 'optional-enum',
    question: 'Under the hood, Swift\'s Optional is an enum. What are its two cases?',
    answer: '.none and .some(Wrapped)',
  },
  {
    id: 'nil-coalescing',
    question: 'What is the ?? operator called?',
    answer: 'The nil-coalescing operator',
  },
  {
    id: 'try-variants',
    question: 'What is the difference between try? and try!?',
    answer: 'try? turns a thrown error into nil. try! crashes if an error is thrown.',
  },
  {
    id: 'guard',
    question: 'Which Swift statement requires its else branch to exit the current scope?',
    answer: 'guard',
    detail: 'It arrived in Swift 2.0.',
  },
  {
    id: 'defer',
    question: 'What does a defer block do?',
    answer: 'It runs when execution leaves the current scope, however it leaves.',
  },
  {
    id: 'escaping',
    question: 'What does marking a closure parameter @escaping mean?',
    answer: 'The closure may be stored and called after the function returns.',
    detail: 'Closure parameters have been non-escaping by default since Swift 3.',
  },
  {
    id: 'hashable-keys',
    question: 'Which protocol must a type conform to before it can be a Dictionary key?',
    answer: 'Hashable',
  },
  {
    id: 'sequence',
    question: 'Which protocol lets a type be used in a for-in loop?',
    answer: 'Sequence',
  },
  {
    id: 'some-keyword',
    question: 'Which keyword, added in Swift 5.1, declares an opaque return type like the one on a SwiftUI body?',
    answer: 'some',
  },
  {
    id: 'result-builders',
    question: 'Which Swift feature lets a SwiftUI body list views without commas or a return statement?',
    answer: 'Result builders',
    detail: 'They were called function builders before Swift 5.4 made them official.',
  },
  {
    id: 'async-await',
    question: 'Which Swift version introduced async/await?',
    answer: 'Swift 5.5',
    detail: 'It shipped with Xcode 13 in 2021, along with actors and structured concurrency.',
  },
  {
    id: 'macros',
    question: 'Which Swift 5.9 feature generates code at compile time and powers @Observable?',
    answer: 'Macros',
  },
  {
    id: 'swift-testing',
    question: 'What is the testing framework Apple introduced in 2024 that uses @Test and #expect?',
    answer: 'Swift Testing',
  },
];
