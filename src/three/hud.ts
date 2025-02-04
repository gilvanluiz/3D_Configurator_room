import * as THREE from "three";
import { Item } from "../items/item";
import { Main } from "./main";

/**
 * Drawings on "top" of the scene. e.g. rotate arrows
 */
export class HUD {
  private scene = new THREE.Scene();

  private selectedItem: Item | null = null;

  private rotating: boolean = false;
  private mouseover: boolean = false;

  private height: number = 5;
  private distance: number = 20;
  private color: number | string = "#ffffff";
  private hoverColor: number | string = "#f1c40f";

  private activeObject: THREE.Object3D | null = null;
  constructor(private three: Main) {
    three.itemSelectedCallbacks.add((item: Item) => this.itemSelected(item));
    three.itemUnselectedCallbacks.add(() => this.itemUnselected());
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getObject() {
    return this.activeObject;
  }

  private resetSelectedItem() {
    this.selectedItem = null;
    if (this.activeObject) {
      this.scene.remove(this.activeObject);
      this.activeObject = null;
    }
  }

  private itemSelected(item: Item) {
    if (this.selectedItem != item) {
      this.resetSelectedItem();
      if (item.allowRotate && !item.fixed) {
        this.selectedItem = item;
        this.activeObject = this.makeObject(this.selectedItem);
        this.scene.add(this.activeObject);
      }
    }
  }

  private itemUnselected() {
    this.resetSelectedItem();
  }

  public setRotating(isRotating: boolean) {
    this.rotating = isRotating;
    this.setColor();
  }

  public setMouseover(isMousedOver: boolean) {
    this.mouseover = isMousedOver;
    this.setColor();
  }

  private setColor() {
    if (this.activeObject) {
      this.activeObject.children.forEach((obj: any) => {
        // FIXME: this is horrible.  There must be a sounder way to do this.
        const color = obj.material?.color;
        if (color && color instanceof THREE.Color) {
          (color as any).set(this.getColor());
        }
      });
    }
    this.three.setNeedsUpdate();
  }

  private getColor() {
    return this.mouseover || this.rotating ? this.hoverColor : this.color;
  }

  public update() {
    if (this.activeObject && this.selectedItem) {
      this.activeObject.rotation.y = this.selectedItem.threeObj.rotation.y;
      this.activeObject.position.x = this.selectedItem.threeObj.position.x;
      this.activeObject.position.z = this.selectedItem.threeObj.position.z;
    }
  }

  private makeLineGeometry(item: Item) {
    var geometry = new THREE.Geometry();

    geometry.vertices.push(new THREE.Vector3(0, 0, 0), this.rotateVector(item));

    return geometry;
  }

  private rotateVector(item: Item) {
    var vec = new THREE.Vector3(
      0,
      0,
      Math.max(item.halfSize.x, item.halfSize.z) + 1.4 + this.distance
    );
    return vec;
  }

  private makeLineMaterial(_rotating: boolean) {
    var mat = new THREE.LineBasicMaterial({
      color: this.getColor(),
      linewidth: 3,
    });
    return mat;
  }

  private makeCone(item: Item) {
    var coneGeo = new THREE.CylinderGeometry(5, 0, 10);
    var coneMat = new THREE.MeshBasicMaterial({
      color: this.getColor(),
    });
    var cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.copy(this.rotateVector(item));

    cone.rotation.x = -Math.PI / 2.0;

    return cone;
  }

  private makeSphere(_item: Item) {
    var geometry = new THREE.SphereGeometry(4, 16, 16);
    var material = new THREE.MeshBasicMaterial({
      color: this.getColor(),
    });
    var sphere = new THREE.Mesh(geometry, material);
    return sphere;
  }

  private makeObject(item: Item) {
    var object = new THREE.Object3D();
    var line = new THREE.Line(
      this.makeLineGeometry(item),
      this.makeLineMaterial(this.rotating),
      THREE.LinePieces
    );

    var cone = this.makeCone(item);
    var sphere = this.makeSphere(item);

    object.add(line);
    object.add(cone);
    object.add(sphere);

    object.rotation.y = item.threeObj.rotation.y;
    object.position.x = item.threeObj.position.x;
    object.position.z = item.threeObj.position.z;
    object.position.y = this.height;

    return object;
  }
}
