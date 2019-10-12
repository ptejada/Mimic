import { computed, observable } from "mobx";
import champSelect, { ChampSelectStore } from "../champ-select-store";
import socket from "../../utils/socket";

/**
 * Sub-store for champ select, responsible for handling the summoner spell picker.
 */
export default class SpellsStore {
    @observable
    summonerSpellMetadata: { id: number, gameModes: string[] }[] = [];

    constructor(private store: ChampSelectStore) {
        socket.observe("/lol-game-data/assets/v1/summoner-spells.json", x => {
            this.summonerSpellMetadata = x.content;
        });
    }

    @computed
    get availableSummoners() {
        const gm = champSelect.gameflowState ? champSelect.gameflowState.gameData.queue.gameMode : "CLASSIC";

        return this.summonerSpellMetadata.filter(x => {
            return x.gameModes.includes(gm);
        });
    }

    /**
     * Selects the summoner spell with the specified ID. This will automatically
     * take care of swapping and ensuring that the correct spell is changed. It
     * will also dismiss the selector.
     */
    public selectSummonerSpell(id: number) {
        let first = this.store.state!.localPlayer.spell1Id;
        let second = this.store.state!.localPlayer.spell2Id;
        if (this.store.interface.pickingFirstSummonerSpell && id === second) {
            second = first;
            first = id;
        } else if (id === first) {
            first = second;
            second = id;
        } else {
            if (this.store.interface.pickingFirstSummonerSpell) first = id;
            else second = id;
        }

        socket.request("/lol-champ-select/v1/session/my-selection", "PATCH", JSON.stringify({
            spell1Id: first,
            spell2Id: second
        }));
        this.store.interface.toggleSpellPicker(true);
    }
}