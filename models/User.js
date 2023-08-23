var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require("bcryptjs");

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  favoriteB: [
    {
      blogger: {
        type: Schema.Types.ObjectId,
        ref: "Users",
      },
    },
  ],
});

UserSchema.pre("save", function (next) {
  this.password = bcrypt.hashSync(this.password, bcrypt.genSaltSync(8), null);
  next();
});

UserSchema.statics.compare = function (cleattext, encrypted) {
  return bcrypt.compareSync(cleattext, encrypted);
};

module.exports = mongoose.model("Users", UserSchema);
