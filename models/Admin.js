import { DataTypes } from "sequelize";
import sequelize from "../db/sequelize.js";

const Admin = sequelize.define(
    "Admin",
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        login: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false }, // lagres som tekst iht. krav
    },
    {
        tableName: "admins",
        timestamps: true,
    }
);

export default Admin;
