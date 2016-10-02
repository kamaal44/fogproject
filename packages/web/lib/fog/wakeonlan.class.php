<?php
/**
 * Wake on lan management class
 *
 * PHP version 5
 *
 * @category WakeOnLan
 * @package  FOGProject
 * @author   Tom Elliott <tommygunsster@gmail.com>
 * @license  http://opensource.org/licenses/gpl-3.0 GPLv3
 * @link     https://fogproject.org
 */
/**
 * Wake on lan management class
 *
 * @category WakeOnLan
 * @package  FOGProject
 * @author   Tom Elliott <tommygunsster@gmail.com>
 * @license  http://opensource.org/licenses/gpl-3.0 GPLv3
 * @link     https://fogproject.org
 */
class WakeOnLan extends FOGBase
{
    /**
     * UDP port default is 9
     *
     * @var int
     */
    private $_port = 9;
    /**
     * MAC Array holder
     *
     * @var array
     */
    private $_arrMAC;
    /**
     * The initializer
     *
     * @param mixed $mac the mac or macs to use
     *
     * @return void
     */
    public function __construct($mac)
    {
        parent::__construct();
        $this->_arrMAC = $this->parseMacList($mac, true);
    }
    /**
     * Send the requests
     *
     * @return void
     */
    public function send()
    {
        if ($this->_arrMAC === false || !count($this->_arrMAC)) {
            throw new Exception(self::$foglang['InvalidMAC']);
        }
        $BroadCast = array_merge(
            (array)'255.255.255.255',
            self::$FOGCore->getBroadcast()
        );
        self::$HookManager->processEvent(
            'BROADCAST_ADDR',
            array(
                'broadcast' => &$BroadCast
            )
        );
        foreach ((array)$this->_arrMAC as &$mac) {
            foreach ((array)$BroadCast as &$SendTo) {
                $mac->wake($SendTo, self::$_port);
                unset($SendTo);
            }
            unset($mac);
        }
    }
}
