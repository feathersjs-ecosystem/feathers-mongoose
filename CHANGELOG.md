# Change Log

## [v5.0.3](https://github.com/feathersjs/feathers-mongoose/tree/v5.0.3) (2017-03-02)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v5.0.2...v5.0.3)

## [v5.0.2](https://github.com/feathersjs/feathers-mongoose/tree/v5.0.2) (2017-03-01)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v5.0.1...v5.0.2)

## [v5.0.1](https://github.com/feathersjs/feathers-mongoose/tree/v5.0.1) (2017-03-01)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v5.0.0...v5.0.1)

**Closed issues:**

- Blowing up Mongoose with undefined value in $push [\#167](https://github.com/feathersjs/feathers-mongoose/issues/167)
- Potential security issue with 409 error [\#166](https://github.com/feathersjs/feathers-mongoose/issues/166)

**Merged pull requests:**

- Parsing fix [\#170](https://github.com/feathersjs/feathers-mongoose/pull/170) ([ekryski](https://github.com/ekryski))

## [v5.0.0](https://github.com/feathersjs/feathers-mongoose/tree/v5.0.0) (2017-02-27)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v4.0.1...v5.0.0)

**Closed issues:**

- Please provide a working example for $push [\#165](https://github.com/feathersjs/feathers-mongoose/issues/165)
- Virtuals [\#164](https://github.com/feathersjs/feathers-mongoose/issues/164)
- How can I pass additional query parameters in a REST `put` operation? [\#162](https://github.com/feathersjs/feathers-mongoose/issues/162)

**Merged pull requests:**

- adding better mongoose conflict error handling [\#168](https://github.com/feathersjs/feathers-mongoose/pull/168) ([ekryski](https://github.com/ekryski))

## [v4.0.1](https://github.com/feathersjs/feathers-mongoose/tree/v4.0.1) (2017-02-03)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v4.0.0...v4.0.1)

**Merged pull requests:**

- Use toObject for create when lean is true [\#160](https://github.com/feathersjs/feathers-mongoose/pull/160) ([daffl](https://github.com/daffl))

## [v4.0.0](https://github.com/feathersjs/feathers-mongoose/tree/v4.0.0) (2017-01-29)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.6.2...v4.0.0)

**Closed issues:**

- Make lean: true by default [\#132](https://github.com/feathersjs/feathers-mongoose/issues/132)

**Merged pull requests:**

- Make lean true by default [\#159](https://github.com/feathersjs/feathers-mongoose/pull/159) ([daffl](https://github.com/daffl))

## [v3.6.2](https://github.com/feathersjs/feathers-mongoose/tree/v3.6.2) (2017-01-13)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.6.1...v3.6.2)

**Closed issues:**

- using lean options in a service with a subdocument model doesn't seem to work  [\#157](https://github.com/feathersjs/feathers-mongoose/issues/157)
- Cast to ObjectId failed for value \_id [\#156](https://github.com/feathersjs/feathers-mongoose/issues/156)

**Merged pull requests:**

- Allow $select to catch and use string syntax [\#158](https://github.com/feathersjs/feathers-mongoose/pull/158) ([jamesjnadeau](https://github.com/jamesjnadeau))
- Added warning msg when options.lean is falsey [\#155](https://github.com/feathersjs/feathers-mongoose/pull/155) ([eddyystop](https://github.com/eddyystop))

## [v3.6.1](https://github.com/feathersjs/feathers-mongoose/tree/v3.6.1) (2016-11-15)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.6.0...v3.6.1)

**Closed issues:**

- feathers-mongoose@3.6.0 break custom model id [\#151](https://github.com/feathersjs/feathers-mongoose/issues/151)
- Disable $where by default [\#148](https://github.com/feathersjs/feathers-mongoose/issues/148)

**Merged pull requests:**

- Do not delete model ids [\#152](https://github.com/feathersjs/feathers-mongoose/pull/152) ([daffl](https://github.com/daffl))

## [v3.6.0](https://github.com/feathersjs/feathers-mongoose/tree/v3.6.0) (2016-11-12)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.5.3...v3.6.0)

**Fixed bugs:**

- patch doesn't throw correct object [\#110](https://github.com/feathersjs/feathers-mongoose/issues/110)

**Closed issues:**

- Patch is deleting subdocument data [\#144](https://github.com/feathersjs/feathers-mongoose/issues/144)
- How do I get average? [\#140](https://github.com/feathersjs/feathers-mongoose/issues/140)
- Support $select in get [\#134](https://github.com/feathersjs/feathers-mongoose/issues/134)
- Add changelog binary to repo [\#114](https://github.com/feathersjs/feathers-mongoose/issues/114)

**Merged pull requests:**

- Update feathers-service-tests to version 0.9.0 🚀 [\#150](https://github.com/feathersjs/feathers-mongoose/pull/150) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- feathers-rest@1.5.2 breaks build ⚠️ [\#147](https://github.com/feathersjs/feathers-mongoose/pull/147) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Node 4+ [\#146](https://github.com/feathersjs/feathers-mongoose/pull/146) ([daffl](https://github.com/daffl))
- babel-core@6.18.2 breaks build ⚠️ [\#143](https://github.com/feathersjs/feathers-mongoose/pull/143) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- babel-cli@6.18.0 breaks build ⚠️ [\#138](https://github.com/feathersjs/feathers-mongoose/pull/138) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- jshint —\> semistandard [\#131](https://github.com/feathersjs/feathers-mongoose/pull/131) ([corymsmith](https://github.com/corymsmith))
- adding code coverage [\#130](https://github.com/feathersjs/feathers-mongoose/pull/130) ([ekryski](https://github.com/ekryski))
- Update feathers-service-tests to version 0.8.1 🚀 [\#124](https://github.com/feathersjs/feathers-mongoose/pull/124) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))

## [v3.5.3](https://github.com/feathersjs/feathers-mongoose/tree/v3.5.3) (2016-10-14)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.5.2...v3.5.3)

**Closed issues:**

- Add MongoDB requirement information to README [\#128](https://github.com/feathersjs/feathers-mongoose/issues/128)
- Query filter does not work with booleans [\#122](https://github.com/feathersjs/feathers-mongoose/issues/122)
- Extending rest api functionality [\#121](https://github.com/feathersjs/feathers-mongoose/issues/121)
- $populate across multiple levels [\#119](https://github.com/feathersjs/feathers-mongoose/issues/119)
- Cannot get REST response to work [\#118](https://github.com/feathersjs/feathers-mongoose/issues/118)
- $or query with a REST GET request \($or needs an array\) [\#117](https://github.com/feathersjs/feathers-mongoose/issues/117)

**Merged pull requests:**

- Adds the posibility to send an object to the $select [\#129](https://github.com/feathersjs/feathers-mongoose/pull/129) ([stalinb87](https://github.com/stalinb87))

## [v3.5.2](https://github.com/feathersjs/feathers-mongoose/tree/v3.5.2) (2016-08-23)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.5.1...v3.5.2)

**Fixed bugs:**

- Cannot $populate on update or patch [\#111](https://github.com/feathersjs/feathers-mongoose/issues/111)

**Closed issues:**

- Soft Delete [\#109](https://github.com/feathersjs/feathers-mongoose/issues/109)
- Routing Feathers service with express [\#108](https://github.com/feathersjs/feathers-mongoose/issues/108)
- Wrong ObjectId passed to service methods on nested routes [\#106](https://github.com/feathersjs/feathers-mongoose/issues/106)
- How to change response code and data [\#102](https://github.com/feathersjs/feathers-mongoose/issues/102)

**Merged pull requests:**

- Ensure we convert mongoose models to regular objects. Closes \#110. [\#112](https://github.com/feathersjs/feathers-mongoose/pull/112) ([ekryski](https://github.com/ekryski))
- Update mocha to version 3.0.0 🚀 [\#107](https://github.com/feathersjs/feathers-mongoose/pull/107) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))

## [v3.5.1](https://github.com/feathersjs/feathers-mongoose/tree/v3.5.1) (2016-07-17)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.5.0...v3.5.1)

**Fixed bugs:**

- Duplicate key errors should be Conflicts not BadRequests [\#104](https://github.com/feathersjs/feathers-mongoose/issues/104)

**Merged pull requests:**

- changing duplicate key error to feathers Conflict error. Closes \#104 [\#105](https://github.com/feathersjs/feathers-mongoose/pull/105) ([ekryski](https://github.com/ekryski))
- Update feathers-query-filters to version 2.0.0 🚀 [\#101](https://github.com/feathersjs/feathers-mongoose/pull/101) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))

## [v3.5.0](https://github.com/feathersjs/feathers-mongoose/tree/v3.5.0) (2016-07-09)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.4.2...v3.5.0)

**Fixed bugs:**

- We shouldn't remove properties from original objects [\#98](https://github.com/feathersjs/feathers-mongoose/issues/98)

**Merged pull requests:**

- feathers-service-tests@0.6.2 breaks build 🚨 [\#100](https://github.com/feathersjs/feathers-mongoose/pull/100) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))

## [v3.4.2](https://github.com/feathersjs/feathers-mongoose/tree/v3.4.2) (2016-07-07)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.4.1...v3.4.2)

**Closed issues:**

- Update README.md to reflect change to 'name' option for the service. [\#96](https://github.com/feathersjs/feathers-mongoose/issues/96)
- Can't use `$inc` in patch [\#95](https://github.com/feathersjs/feathers-mongoose/issues/95)
- Is this possible for multiple insert using Feathers mongoose? [\#94](https://github.com/feathersjs/feathers-mongoose/issues/94)

**Merged pull requests:**

- Adding Context:'query' so validators get the updating document [\#99](https://github.com/feathersjs/feathers-mongoose/pull/99) ([quick691fr](https://github.com/quick691fr))
- Update README.md [\#97](https://github.com/feathersjs/feathers-mongoose/pull/97) ([githugger](https://github.com/githugger))
- mongoose@4.5.2 breaks build 🚨 [\#93](https://github.com/feathersjs/feathers-mongoose/pull/93) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))

## [v3.4.1](https://github.com/feathersjs/feathers-mongoose/tree/v3.4.1) (2016-06-21)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.4.0...v3.4.1)

**Closed issues:**

- Support passing mongoose specific params to queries. [\#70](https://github.com/feathersjs/feathers-mongoose/issues/70)
- Add a way to $push in a PATCH [\#68](https://github.com/feathersjs/feathers-mongoose/issues/68)
- Handle duplicate key errors as a special case [\#67](https://github.com/feathersjs/feathers-mongoose/issues/67)

**Merged pull requests:**

- Wrapping native mongoldb errors. Specifically duplicate key errors. [\#92](https://github.com/feathersjs/feathers-mongoose/pull/92) ([ekryski](https://github.com/ekryski))
- Adding support to be able to do $push, $set, etc. on patch [\#91](https://github.com/feathersjs/feathers-mongoose/pull/91) ([ekryski](https://github.com/ekryski))

## [v3.4.0](https://github.com/feathersjs/feathers-mongoose/tree/v3.4.0) (2016-06-17)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.3.7...v3.4.0)

**Closed issues:**

- \_id is a string [\#89](https://github.com/feathersjs/feathers-mongoose/issues/89)
- Embedded documents validation using model validation [\#88](https://github.com/feathersjs/feathers-mongoose/issues/88)
- Cast to ObjectId failed for value X at path "\_id" [\#81](https://github.com/feathersjs/feathers-mongoose/issues/81)
- $populate documentation [\#75](https://github.com/feathersjs/feathers-mongoose/issues/75)
- Change remove-all syntax. [\#74](https://github.com/feathersjs/feathers-mongoose/issues/74)
- update operations don't fail if required keys are missing. [\#73](https://github.com/feathersjs/feathers-mongoose/issues/73)
- Support $search [\#50](https://github.com/feathersjs/feathers-mongoose/issues/50)

**Merged pull requests:**

- Update feathers-service-tests to version 0.6.0 🚀 [\#90](https://github.com/feathersjs/feathers-mongoose/pull/90) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Adding runValidators [\#87](https://github.com/feathersjs/feathers-mongoose/pull/87) ([marshallswain](https://github.com/marshallswain))
- mocha@2.5.0 breaks build 🚨 [\#86](https://github.com/feathersjs/feathers-mongoose/pull/86) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Update babel-plugin-add-module-exports to version 0.2.0 🚀 [\#84](https://github.com/feathersjs/feathers-mongoose/pull/84) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))

## [v3.3.7](https://github.com/feathersjs/feathers-mongoose/tree/v3.3.7) (2016-04-21)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.3.6...v3.3.7)

**Fixed bugs:**

- $select doesn't work in find? [\#71](https://github.com/feathersjs/feathers-mongoose/issues/71)

**Closed issues:**

- hooks.toObject\(\) fails if data is paginated [\#77](https://github.com/feathersjs/feathers-mongoose/issues/77)
- Bypass of methods [\#76](https://github.com/feathersjs/feathers-mongoose/issues/76)
- custom query [\#69](https://github.com/feathersjs/feathers-mongoose/issues/69)

**Merged pull requests:**

- Fix for toObject hook [\#78](https://github.com/feathersjs/feathers-mongoose/pull/78) ([harangue](https://github.com/harangue))
- Fixed overwrite option: was always true [\#72](https://github.com/feathersjs/feathers-mongoose/pull/72) ([leo-nard](https://github.com/leo-nard))

## [v3.3.6](https://github.com/feathersjs/feathers-mongoose/tree/v3.3.6) (2016-02-24)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.3.5...v3.3.6)

**Merged pull requests:**

- bumping feathers-errors version [\#66](https://github.com/feathersjs/feathers-mongoose/pull/66) ([ekryski](https://github.com/ekryski))

## [v3.3.5](https://github.com/feathersjs/feathers-mongoose/tree/v3.3.5) (2016-02-23)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.3.4...v3.3.5)

**Merged pull requests:**

- enforcing that you shouldn't be able to change ids [\#65](https://github.com/feathersjs/feathers-mongoose/pull/65) ([ekryski](https://github.com/ekryski))

## [v3.3.4](https://github.com/feathersjs/feathers-mongoose/tree/v3.3.4) (2016-02-23)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.3.3...v3.3.4)

**Closed issues:**

- Updating/Patching with custom ids results in orphaned documents. [\#63](https://github.com/feathersjs/feathers-mongoose/issues/63)

**Merged pull requests:**

- custom ids no longer get deleted on patch and update. Closes \#63 [\#64](https://github.com/feathersjs/feathers-mongoose/pull/64) ([ekryski](https://github.com/ekryski))

## [v3.3.3](https://github.com/feathersjs/feathers-mongoose/tree/v3.3.3) (2016-02-23)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.3.2...v3.3.3)

**Closed issues:**

- Error handler should reject not throw [\#61](https://github.com/feathersjs/feathers-mongoose/issues/61)

**Merged pull requests:**

- Convert errorHandler to return a rejected promise instead of throwing [\#62](https://github.com/feathersjs/feathers-mongoose/pull/62) ([daffl](https://github.com/daffl))

## [v3.3.2](https://github.com/feathersjs/feathers-mongoose/tree/v3.3.2) (2016-02-22)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.3.1...v3.3.2)

**Merged pull requests:**

- Example update [\#60](https://github.com/feathersjs/feathers-mongoose/pull/60) ([ekryski](https://github.com/ekryski))

## [v3.3.1](https://github.com/feathersjs/feathers-mongoose/tree/v3.3.1) (2016-02-20)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.3.0...v3.3.1)

**Closed issues:**

- option.id ignored in \_get [\#58](https://github.com/feathersjs/feathers-mongoose/issues/58)
- What is the best way for validate mongoose models? [\#57](https://github.com/feathersjs/feathers-mongoose/issues/57)
- Validation errors return an HTTP 500 Error [\#56](https://github.com/feathersjs/feathers-mongoose/issues/56)
- how to catch MongoError [\#55](https://github.com/feathersjs/feathers-mongoose/issues/55)
- Documentation on troubleshooting [\#31](https://github.com/feathersjs/feathers-mongoose/issues/31)

**Merged pull requests:**

- get should use the options.id attribute. Closes \#58 [\#59](https://github.com/feathersjs/feathers-mongoose/pull/59) ([ekryski](https://github.com/ekryski))

## [v3.3.0](https://github.com/feathersjs/feathers-mongoose/tree/v3.3.0) (2016-02-12)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.2.0...v3.3.0)

**Closed issues:**

- $populate options does not work in get\(\) queries [\#53](https://github.com/feathersjs/feathers-mongoose/issues/53)

**Merged pull requests:**

- Implement $populate option in params.query on get\(\) [\#54](https://github.com/feathersjs/feathers-mongoose/pull/54) ([BigAB](https://github.com/BigAB))

## [v3.2.0](https://github.com/feathersjs/feathers-mongoose/tree/v3.2.0) (2016-02-09)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.1.1...v3.2.0)

**Closed issues:**

- use .lean\(\) liberally in fetch's? [\#51](https://github.com/feathersjs/feathers-mongoose/issues/51)
- Document using $regex [\#49](https://github.com/feathersjs/feathers-mongoose/issues/49)
- Adding fields on update isn't currently possible [\#48](https://github.com/feathersjs/feathers-mongoose/issues/48)
- toObject\(\) hook should check for presence of .toObject\(\) [\#44](https://github.com/feathersjs/feathers-mongoose/issues/44)
- With toObject\(\), ObjectIDs aren't stringified. [\#43](https://github.com/feathersjs/feathers-mongoose/issues/43)

**Merged pull requests:**

- Running lean [\#52](https://github.com/feathersjs/feathers-mongoose/pull/52) ([ekryski](https://github.com/ekryski))

## [v3.1.1](https://github.com/feathersjs/feathers-mongoose/tree/v3.1.1) (2016-01-30)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.1.0...v3.1.1)

**Merged pull requests:**

- Make result counting optional and enable only for pagination [\#47](https://github.com/feathersjs/feathers-mongoose/pull/47) ([daffl](https://github.com/daffl))

## [v3.1.0](https://github.com/feathersjs/feathers-mongoose/tree/v3.1.0) (2016-01-30)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.0.4...v3.1.0)

**Merged pull requests:**

- Use internal methods instead of service methods directly [\#46](https://github.com/feathersjs/feathers-mongoose/pull/46) ([daffl](https://github.com/daffl))
- Remove array check in create. [\#45](https://github.com/feathersjs/feathers-mongoose/pull/45) ([marshallswain](https://github.com/marshallswain))

## [v3.0.4](https://github.com/feathersjs/feathers-mongoose/tree/v3.0.4) (2016-01-08)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.0.3...v3.0.4)

**Implemented enhancements:**

- Support batch creates [\#21](https://github.com/feathersjs/feathers-mongoose/issues/21)
- Support batch updates [\#20](https://github.com/feathersjs/feathers-mongoose/issues/20)

**Merged pull requests:**

- Documenting the toObject hook. [\#41](https://github.com/feathersjs/feathers-mongoose/pull/41) ([marshallswain](https://github.com/marshallswain))

## [v3.0.3](https://github.com/feathersjs/feathers-mongoose/tree/v3.0.3) (2016-01-08)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.0.2...v3.0.3)

**Closed issues:**

- $populate is broken [\#40](https://github.com/feathersjs/feathers-mongoose/issues/40)

## [v3.0.2](https://github.com/feathersjs/feathers-mongoose/tree/v3.0.2) (2016-01-08)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.0.1...v3.0.2)

**Implemented enhancements:**

- Support replica sets [\#19](https://github.com/feathersjs/feathers-mongoose/issues/19)

**Closed issues:**

- Docs for extending are wrong [\#39](https://github.com/feathersjs/feathers-mongoose/issues/39)
- Named export 'service' should expose constructor function, not init function [\#37](https://github.com/feathersjs/feathers-mongoose/issues/37)
- No documentation for Error handling [\#28](https://github.com/feathersjs/feathers-mongoose/issues/28)
- Add documentation for use with feathers-hooks [\#25](https://github.com/feathersjs/feathers-mongoose/issues/25)

## [v3.0.1](https://github.com/feathersjs/feathers-mongoose/tree/v3.0.1) (2016-01-08)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v3.0.0...v3.0.1)

**Closed issues:**

- ES6 export doesn't work with module export plugin [\#35](https://github.com/feathersjs/feathers-mongoose/issues/35)

**Merged pull requests:**

- Fix default module export for ES5 environments [\#36](https://github.com/feathersjs/feathers-mongoose/pull/36) ([daffl](https://github.com/daffl))

## [v3.0.0](https://github.com/feathersjs/feathers-mongoose/tree/v3.0.0) (2016-01-04)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v2.0.0...v3.0.0)

**Implemented enhancements:**

- Auto-generate documentation from schema [\#9](https://github.com/feathersjs/feathers-mongoose/issues/9)
- Validation error should be returned as JSON [\#6](https://github.com/feathersjs/feathers-mongoose/issues/6)

**Fixed bugs:**

- Validation error should be returned as JSON [\#6](https://github.com/feathersjs/feathers-mongoose/issues/6)

**Closed issues:**

- Add docs for overriding the service methods \(patch for example\) [\#34](https://github.com/feathersjs/feathers-mongoose/issues/34)
- NPM Release for feathers-hooks [\#29](https://github.com/feathersjs/feathers-mongoose/issues/29)
- Events? [\#27](https://github.com/feathersjs/feathers-mongoose/issues/27)
- How to override service methods [\#26](https://github.com/feathersjs/feathers-mongoose/issues/26)
- Utilize query.lean\(\) to get plain objects. [\#24](https://github.com/feathersjs/feathers-mongoose/issues/24)
- Document using virtuals. [\#23](https://github.com/feathersjs/feathers-mongoose/issues/23)

**Merged pull requests:**

- Update to ES6 [\#33](https://github.com/feathersjs/feathers-mongoose/pull/33) ([ekryski](https://github.com/ekryski))
- Add toObject hook for documents. [\#32](https://github.com/feathersjs/feathers-mongoose/pull/32) ([marshallswain](https://github.com/marshallswain))
- delete app.configure\(feathers.errors\(\)\) [\#30](https://github.com/feathersjs/feathers-mongoose/pull/30) ([verdeairo](https://github.com/verdeairo))
- Add feathers-hooks compatibility. [\#22](https://github.com/feathersjs/feathers-mongoose/pull/22) ([marshallswain](https://github.com/marshallswain))

## [v2.0.0](https://github.com/feathersjs/feathers-mongoose/tree/v2.0.0) (2015-08-05)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/2.0.0-pre.1...v2.0.0)

**Implemented enhancements:**

- Validation [\#2](https://github.com/feathersjs/feathers-mongoose/issues/2)
- Support for relationships [\#1](https://github.com/feathersjs/feathers-mongoose/issues/1)

**Closed issues:**

- Should use underscores to donate filter params vs. params that are on a model [\#17](https://github.com/feathersjs/feathers-mongoose/issues/17)
- Update examples for 1.0.0 and add example for extension [\#15](https://github.com/feathersjs/feathers-mongoose/issues/15)

**Merged pull requests:**

- Release 2.0.0 [\#18](https://github.com/feathersjs/feathers-mongoose/pull/18) ([ekryski](https://github.com/ekryski))

## [2.0.0-pre.1](https://github.com/feathersjs/feathers-mongoose/tree/2.0.0-pre.1) (2014-07-19)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v1.2.0...2.0.0-pre.1)

**Implemented enhancements:**

- Rename to feathers-mongoose [\#14](https://github.com/feathersjs/feathers-mongoose/issues/14)

**Closed issues:**

- Allow overriding default CRUD methods [\#12](https://github.com/feathersjs/feathers-mongoose/issues/12)

## [v1.2.0](https://github.com/feathersjs/feathers-mongoose/tree/v1.2.0) (2014-06-06)
[Full Changelog](https://github.com/feathersjs/feathers-mongoose/compare/v1.1.0...v1.2.0)

## [v1.1.0](https://github.com/feathersjs/feathers-mongoose/tree/v1.1.0) (2014-04-23)
**Implemented enhancements:**

- Getter methods for Mongoose schema and model [\#10](https://github.com/feathersjs/feathers-mongoose/issues/10)
- Add `feathers-plugin` to keywords of package.json [\#8](https://github.com/feathersjs/feathers-mongoose/issues/8)
- Limited peerDependencies versions [\#7](https://github.com/feathersjs/feathers-mongoose/issues/7)
- Searching \(READ ALL\) [\#4](https://github.com/feathersjs/feathers-mongoose/issues/4)
- Sorting [\#3](https://github.com/feathersjs/feathers-mongoose/issues/3)

**Fixed bugs:**

- Limited peerDependencies versions [\#7](https://github.com/feathersjs/feathers-mongoose/issues/7)
- Mongoose TypeError when creating Schema [\#5](https://github.com/feathersjs/feathers-mongoose/issues/5)

**Merged pull requests:**

- Version bump and badges fix [\#13](https://github.com/feathersjs/feathers-mongoose/pull/13) ([Glavin001](https://github.com/Glavin001))
- Cleaned up a few things [\#11](https://github.com/feathersjs/feathers-mongoose/pull/11) ([agonbina](https://github.com/agonbina))



\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*