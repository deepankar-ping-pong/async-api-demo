/* checksum : b33818e352377bbaf7eebe6dc092fe58 */
namespace com.mycompany;

@cds.external : 'true'
@AsyncAPI.Title : 'User Creation'
@AsyncAPI.SchemaVersion : '0.1.0'
@AsyncAPI.Description : 'This is the user creation API.'
service User {
  @cds.external : 'true'
  @topic : 'com.mycompany.User.create.v1'
  event create.v1 {
    @mandatory : true
    firstName : LargeString;
    @mandatory : true
    lastName : LargeString;
    @mandatory : true
    email : LargeString;
  };
};

