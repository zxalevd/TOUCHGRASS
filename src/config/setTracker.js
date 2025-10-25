class SetTracker {

    static setTracker = {};

    static clearInstance(userId) {
        delete SetTracker.setTracker[userId];
    }

    static hasInstance(userId) {
        return userId in SetTracker.setTracker;
    }

    static startInstance(userId, set) {
        if (userId in SetTracker.setTracker) throw new Error("User already started a set.");
        const imgs = {};
        for (const img of set.imgs) {
            imgs[img.id] = {
                seq_no: img.seq_no,
                skipped: false,
                completed: false,
                hinted: false,
                evidence_id: null,
            };
        }
        SetTracker.setTracker[userId] = {
            setId: set.id,
            imgs: imgs,
            start: Date.now(),
            end: Date.now() + set.time_limit * 1000,
        };
    }

    static instanceTimedOut(userId) {
        if (!(userId in SetTracker.setTracker)) throw new Error("Timer not started for this user");
        return Date.now() > SetTracker.setTracker[userId].end;
    }

    static getInstance(userId) {
        if (!(userId in SetTracker.setTracker)) throw new Error("Timer not started for this user");
        return SetTracker.setTracker[userId];
    }

    static completeImg(userId, evidenceId) {
        const instance = SetTracker.getInstance(userId);
        instance.imgs[evidenceId].completed = true;
        instance.imgs[evidenceId].evidence_id = evidenceId;
    }

    static skipImg(userId, imgId) {
        const instance = SetTracker.getInstance(userId);
        instance.imgs[imgId].skipped = true;
    }

    static hintImg(userId, imgId) {
        const instance = SetTracker.getInstance(userId);
        instance.imgs[imgId].hinted = true;
    }

    static canAccessImage(userId, imgId) {
        const instance = SetTracker.getInstance(userId);
        // Ensure all previous images (sequence) are skipped or completed
        const imgSeqNo = instance.imgs[imgId].seq_no;
        for (const imgKey in instance.imgs) {
            const img = instance.imgs[imgKey];
            if (img.seq_no < imgSeqNo) {
                if (!img.skipped && !img.completed) {
                    return false;
                }
            }
        }
        return true;
    }
}

export default SetTracker;