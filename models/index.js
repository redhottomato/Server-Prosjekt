import Participant from "./Participant.js";
import Admin from "./Admin.js";
import Work from "./Work.js";
import Home from "./Home.js";

// 1–1 Participant -> Work (via participants.email)
Participant.hasOne(Work, {
    foreignKey: "participantEmail",
    sourceKey: "email",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
Work.belongsTo(Participant, {
    foreignKey: "participantEmail",
    targetKey: "email",
});

// 1–1 Participant -> Home (via participants.email)
Participant.hasOne(Home, {
    foreignKey: "participantEmail",
    sourceKey: "email",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
Home.belongsTo(Participant, {
    foreignKey: "participantEmail",
    targetKey: "email",
});

export { Participant, Admin, Work, Home };
