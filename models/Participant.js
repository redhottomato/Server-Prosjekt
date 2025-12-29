import { DataTypes } from "sequelize";
import sequelize from "../db/sequelize.js";

const Participant = sequelize.define(
    "Participant",
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

        firstName: { type: DataTypes.STRING, allowNull: false },
        lastName: { type: DataTypes.STRING, allowNull: false },

        email: { type: DataTypes.STRING, allowNull: true, unique: true },
        phone: { type: DataTypes.STRING, allowNull: true },

        idNumber: { type: DataTypes.STRING, allowNull: true }, // f.eks. ID/passnr (valgfritt)
    },
    {
        tableName: "participants",
        timestamps: true,
    }
);

export default Participant;
