/*
 * This program and the accompanying materials are made available under the terms of the *
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at *
 * https://www.eclipse.org/legal/epl-v20.html                                      *
 *                                                                                 *
 * SPDX-License-Identifier: EPL-2.0                                                *
 *                                                                                 *
 * Copyright Contributors to the Zowe Project.                                     *
 *                                                                                 *
 */

import { IZoweTree, IZoweTreeNode } from "@zowe/zowe-explorer-api";
import { PersistentFilters } from "../PersistentFilters";
import { Profiles } from "../Profiles";
import { syncSessionNode } from "../utils/ProfilesUtils";
import { ZoweExplorerApiRegister } from "../ZoweExplorerApiRegister";
import { resetValidationSettings, returnIconState } from "./actions";
import { labelRefresh } from "./utils";
import * as contextually from "../shared/context";
import * as globals from "../globals";
import { removeSession } from "../utils/SessionUtils";

/**
 * View (DATA SETS, JOBS, USS) refresh button
 * Refreshes treeView and profiles including their validation setting
 *
 * @param {IZoweTree} treeProvider
 */
export async function refreshAll(treeProvider: IZoweTree<IZoweTreeNode>) {
    await Profiles.getInstance().refresh(ZoweExplorerApiRegister.getInstance());

    const nodesToRefresh = Array.from(treeProvider.mNodeMap.entries());

    const refreshNode = async (node) => {
        labelRefresh(node);
        node.children = [];
        node.dirty = true;
        if (node.label.toString() !== "Favorites") {
            const setting = (await PersistentFilters.getDirectValue(
                globals.SETTINGS_AUTOMATIC_PROFILE_VALIDATION
            )) as boolean;
            resetValidationSettings(node, setting);
        }
        returnIconState(node);
        await syncSessionNode(Profiles.getInstance())((profileValue) =>
            ZoweExplorerApiRegister.getCommonApi(profileValue).getSession()
        )(node);
    }

    const profiles = await Profiles.getInstance().fetchAllProfiles();
    nodesToRefresh.forEach(async ([ label, nodePair ]) => {
        const { favNode, nonFavNode } = nodePair;
        const found = profiles.some((prof) => prof.name === label.toString().trim());
        if (found) {
            refreshNode(favNode ?? nonFavNode);
        } else {
            await removeSession(treeProvider, nonFavNode.label.toString().trim());
        }
    });

    // treeProvider.mSessionNodes.forEach(async (sessNode) => {
    //     const found = profiles.some((prof) => prof.name === sessNode.label.toString().trim());
    //     if (found || sessNode.label.toString() === "Favorites") {
    //         const setting = (await PersistentFilters.getDirectValue(
    //             globals.SETTINGS_AUTOMATIC_PROFILE_VALIDATION
    //         )) as boolean;
    //         if (contextually.isSessionNotFav(sessNode)) {
    //             labelRefresh(sessNode);
    //             sessNode.children = [];
    //             sessNode.dirty = true;
    //             if (sessNode.label.toString() !== "Favorites") {
    //                 resetValidationSettings(sessNode, setting);
    //             }
    //             returnIconState(sessNode);
    //             await syncSessionNode(Profiles.getInstance())((profileValue) =>
    //                 ZoweExplorerApiRegister.getCommonApi(profileValue).getSession()
    //             )(sessNode);
    //         }
    //         treeProvider.refresh();
    //     } else {
    //         await removeSession(treeProvider, sessNode.label.toString().trim());
    //     }
    // });
}
